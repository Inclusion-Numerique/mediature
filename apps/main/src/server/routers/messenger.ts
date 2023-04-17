import { MessageStatus } from '@prisma/client';

import { prisma } from '@mediature/main/prisma/client';
import { Attachment as EmailAttachment, mailer } from '@mediature/main/src/emails/mailer';
import { useServerTranslation } from '@mediature/main/src/i18n';
import {
  GetMessageRecipientsSuggestionsSchema,
  UpdateMessageMetadataSchema,
  sendMessageAttachmentsMax,
} from '@mediature/main/src/models/actions/messenger';
import { ListMessagesSchema, SendMessageSchema } from '@mediature/main/src/models/actions/messenger';
import { AttachmentKindSchema } from '@mediature/main/src/models/entities/attachment';
import { ContactInputSchemaType, MessageSchemaType } from '@mediature/main/src/models/entities/messenger';
import { canUserManageThisCase } from '@mediature/main/src/server/routers/case';
import { formatSafeAttachmentsToProcess } from '@mediature/main/src/server/routers/common/attachment';
import { contactInputPrismaToModel, contactPrismaToModel, messagePrismaToModel } from '@mediature/main/src/server/routers/mappers';
import { privateProcedure, router } from '@mediature/main/src/server/trpc';
import { inlineEditorStateToHtml } from '@mediature/ui/src/utils/lexical';

export const messengerRouter = router({
  sendMessage: privateProcedure.input(SendMessageSchema).mutation(async ({ ctx, input }) => {
    await canUserManageThisCase(ctx.user.id, input.caseId);

    const senderUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.user.id,
      },
    });

    const targetedCase = await prisma.case.findUniqueOrThrow({
      where: {
        id: input.caseId,
      },
      include: {
        citizen: true,
      },
    });

    const { attachmentsToAdd, markNewAttachmentsAsUsed } = await formatSafeAttachmentsToProcess(
      AttachmentKindSchema.Values.MESSAGE_DOCUMENT,
      input.attachments,
      [],
      {
        maxAttachmentsTotal: sendMessageAttachmentsMax,
      }
    );

    const { t } = useServerTranslation('common');

    const fromContact: ContactInputSchemaType = {
      email: `${t('model.case.technicalName', { humanId: targetedCase.humanId.toString() })}@${process.env.MAILER_DEFAULT_DOMAIN || ''}`,
      name: `${senderUser.firstname} de Médiature`, // Only the firstname for privacy reasons
    };

    const newMessage = await prisma.message.create({
      data: {
        subject: input.subject,
        content: input.content,
        status: MessageStatus.PENDING,
        from: {
          connectOrCreate: {
            where: {
              email_name: {
                email: fromContact.email,
                name: fromContact.name || '',
              },
            },
            create: {
              email: fromContact.email,
              name: fromContact.name,
            },
          },
        },
        to: {
          create: input.to.map((toContact) => {
            return {
              recipient: {
                connectOrCreate: {
                  where: {
                    email_name: {
                      email: toContact.email,
                      name: toContact.name || '',
                    },
                  },
                  create: {
                    email: toContact.email,
                  },
                },
              },
            };
          }),
        },
        MessagesOnCases: {
          create: {
            markedAsProcessed: null,
            case: {
              connect: {
                id: input.caseId,
              },
            },
          },
        },
        AttachmentsOnMessages: {
          createMany: {
            skipDuplicates: true,
            data: attachmentsToAdd.map((attachmentId) => {
              return {
                attachmentId: attachmentId,
              };
            }),
          },
        },
      },
      include: {
        to: {
          include: {
            recipient: true,
          },
        },
        AttachmentsOnMessages: {
          include: {
            attachment: {
              select: {
                contentType: true,
                name: true,
                value: true,
              },
            },
          },
        },
      },
    });

    let finalStatus: MessageStatus;

    try {
      const htmlMessageContent = inlineEditorStateToHtml(newMessage.content);
      const attachments: EmailAttachment[] = newMessage.AttachmentsOnMessages.map((aOM) => {
        return {
          contentType: aOM.attachment.contentType,
          filename: aOM.attachment.name || undefined,
          content: aOM.attachment.value,
        };
      });

      const recipients = newMessage.to.map((toContact) => toContact.recipient);
      const requesterRecipient = recipients.find((recipient) => recipient.email === targetedCase.citizen.email);
      const otherRecipients = recipients.filter((recipient) => recipient.email !== targetedCase.citizen.email);

      // Format the message differently either the recipient is the case requester, or another contact
      if (requesterRecipient) {
        await mailer.sendCaseMessageToRequester({
          recipients: [requesterRecipient.email],
          subject: newMessage.subject,
          firstname: targetedCase.citizen.firstname,
          lastname: targetedCase.citizen.lastname,
          caseHumanId: targetedCase.humanId.toString(),
          htmlMessageContent: htmlMessageContent,
          attachments: attachments,
        });
      }

      if (otherRecipients.length > 0) {
        await mailer.sendCaseMessage({
          recipients: otherRecipients.map((recipient) => recipient.email),
          subject: newMessage.subject,
          caseHumanId: targetedCase.humanId.toString(),
          htmlMessageContent: htmlMessageContent,
          attachments: attachments,
        });
      }

      finalStatus = MessageStatus.TRANSFERRED;
    } catch (err) {
      console.error(err);

      finalStatus = MessageStatus.ERROR;
    }

    await markNewAttachmentsAsUsed();

    const updatedMessage = await prisma.message.update({
      where: {
        id: newMessage.id,
      },
      data: {
        status: finalStatus,
      },
      include: {
        from: true,
        to: {
          include: {
            recipient: true,
          },
        },
        MessagesOnCases: true,
        AttachmentsOnMessages: {
          include: {
            attachment: {
              select: {
                id: true,
                contentType: false,
                name: true,
                size: false,
              },
            },
          },
        },
      },
    });

    return {
      message: await messagePrismaToModel({
        ...updatedMessage,
        consideredAsProcessed: updatedMessage.MessagesOnCases?.markedAsProcessed || null,
        from: updatedMessage.from,
        to: updatedMessage.to.map((toContact) => toContact.recipient),
        attachments: updatedMessage.AttachmentsOnMessages.map((aOnM) => aOnM.attachment),
      }),
    };
  }),
  updateMessageMetada: privateProcedure.input(UpdateMessageMetadataSchema).mutation(async ({ ctx, input }) => {
    const message = await prisma.message.findUniqueOrThrow({
      where: {
        id: input.messageId,
      },
      include: {
        MessagesOnCases: true,
      },
    });

    if (!message.MessagesOnCases) {
      throw new Error('internal error TODO');
    }

    await canUserManageThisCase(ctx.user.id, message.MessagesOnCases.caseId);

    if (input.markAsProcessed !== undefined) {
      // If `null` it means the message comes from the platform and cannot be toggled as processed or not
      if (message.MessagesOnCases.markedAsProcessed === null) {
        throw new Error('vous ne pouvez que considérer comme traité ou non des messages reçus');
      }

      await prisma.messagesOnCases.update({
        where: {
          messageId: message.id,
        },
        data: {
          markedAsProcessed: input.markAsProcessed,
        },
      });
    }
  }),
  getMessageRecipientsSuggestions: privateProcedure.input(GetMessageRecipientsSuggestionsSchema).query(async ({ ctx, input }) => {
    await canUserManageThisCase(ctx.user.id, input.caseId);

    const targetedCase = await prisma.case.findUniqueOrThrow({
      where: {
        id: input.caseId,
      },
      include: {
        citizen: true,
      },
    });

    const recipients = await prisma.contact.findMany({
      where: {
        RecipientContactsOnMessages: {
          some: {},
          every: {
            message: {
              MessagesOnCases: {
                caseId: targetedCase.id,
              },
            },
          },
        },
      },
      // TODO: ... seems not possible, that's fine for now if the sender does not specify the recipients names
      // orderBy: {
      //   RecipientContactsOnMessages: {
      //     message: {
      //       createdAt: 'desc',
      //     },
      //   },
      // },
      distinct: ['email'], // We do not distinguish on "email+name" to reuse always the last name for this email
    });

    const recipientsSuggestions = recipients.map((recipient) => contactInputPrismaToModel(recipient));

    // Add the citizen email if any and if not in the results
    if (
      targetedCase.citizen.email &&
      !recipientsSuggestions.find((recipient) => {
        return recipient.email === targetedCase.citizen.email;
      })
    ) {
      recipientsSuggestions.push({
        email: targetedCase.citizen.email,
        name: null,
      });
    }

    return {
      recipientsSuggestions: recipientsSuggestions,
    };
  }),
  listMessages: privateProcedure.input(ListMessagesSchema).query(async ({ ctx, input }) => {
    const caseId = input.filterBy.caseIds ? input.filterBy.caseIds[0] : ''; // For now, requires exactly 1 case
    await canUserManageThisCase(ctx.user.id, caseId);

    const messages = await prisma.message.findMany({
      where: {
        MessagesOnCases: {
          caseId: caseId,
        },
      },
      include: {
        from: true,
        to: {
          include: {
            recipient: true,
          },
        },
        MessagesOnCases: true,
        AttachmentsOnMessages: {
          include: {
            attachment: {
              select: {
                id: true,
                contentType: false,
                name: true,
                size: false,
              },
            },
          },
        },
      },
    });

    return {
      messages: await Promise.all(
        messages.map(async (message): Promise<MessageSchemaType> => {
          return await messagePrismaToModel({
            ...message,
            consideredAsProcessed: message.MessagesOnCases?.markedAsProcessed || null,
            from: message.from,
            to: message.to.map((toContact) => toContact.recipient),
            attachments: message.AttachmentsOnMessages.map((aOnM) => aOnM.attachment),
          });
        })
      ),
    };
  }),
});
