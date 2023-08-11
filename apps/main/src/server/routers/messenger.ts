import { MessageStatus } from '@prisma/client';
import addresscompiler from 'addresscompiler';
import { JSDOM } from 'jsdom';

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
import { getCaseEmail } from '@mediature/main/src/utils/business/case';
import { inlineEditorStateToHtml } from '@mediature/ui/src/utils/lexical';

const serverJsdom = new JSDOM();

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
      email: getCaseEmail(t, targetedCase.humanId.toString()),
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
            // If other cases are in the recipients we do not link them here,
            // it will be handled in another message (on the receiver side)
            markedAsProcessed: null,
            case: {
              connect: {
                id: targetedCase.id,
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
                inline: false, // For now the editor does not allow inline documents
              };
            }),
          },
        },
      },
      include: {
        from: true,
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
      const htmlMessageContent = inlineEditorStateToHtml(newMessage.content, serverJsdom);
      const attachments: EmailAttachment[] = newMessage.AttachmentsOnMessages.map((aOM) => {
        return {
          contentType: aOM.attachment.contentType,
          filename: aOM.attachment.name || undefined,
          content: aOM.attachment.value,
          inline: aOM.inline,
        };
      });

      const sender = addresscompiler.compile({
        address: fromContact.email,
        name: fromContact.name,
      });
      const recipients = newMessage.to.map((toContact) => toContact.recipient);
      const requesterRecipient = recipients.find((recipient) => recipient.email === targetedCase.citizen.email);
      const otherRecipients = recipients.filter((recipient) => recipient.email !== targetedCase.citizen.email);

      // Format the message differently either the recipient is the case requester, or another contact
      if (requesterRecipient) {
        await mailer.sendCaseMessageToRequester({
          sender: sender,
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
          sender: sender,
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

    const updatedMessageOnCase = await prisma.messagesOnCases.update({
      where: {
        caseId_messageId: {
          caseId: targetedCase.id,
          messageId: newMessage.id,
        },
      },
      data: {
        message: {
          update: {
            status: finalStatus,
          },
        },
      },
      include: {
        message: {
          include: {
            from: true,
            to: {
              include: {
                recipient: true,
              },
            },
            AttachmentsOnMessages: {
              include: {
                attachment: {
                  select: {
                    id: true,
                    contentType: true,
                    name: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      message: await messagePrismaToModel({
        ...updatedMessageOnCase.message,
        consideredAsProcessed: updatedMessageOnCase.markedAsProcessed,
        from: updatedMessageOnCase.message.from,
        to: updatedMessageOnCase.message.to.map((toContact) => toContact.recipient),
        attachments: updatedMessageOnCase.message.AttachmentsOnMessages.map((aOnM) => ({
          ...aOnM.attachment,
          inline: aOnM.inline,
        })),
      }),
    };
  }),
  updateMessageMetadata: privateProcedure.input(UpdateMessageMetadataSchema).mutation(async ({ ctx, input }) => {
    const messageOnCase = await prisma.messagesOnCases.findUniqueOrThrow({
      where: {
        caseId_messageId: {
          caseId: input.caseId,
          messageId: input.messageId,
        },
      },
    });

    await canUserManageThisCase(ctx.user.id, messageOnCase.caseId);

    if (input.markAsProcessed !== undefined) {
      // If `null` it means the message comes from the platform and cannot be toggled as processed or not
      if (messageOnCase.markedAsProcessed === null) {
        throw new Error('vous ne pouvez que considérer comme traité ou non des messages reçus');
      }

      await prisma.messagesOnCases.update({
        where: {
          caseId_messageId: {
            caseId: messageOnCase.caseId,
            messageId: messageOnCase.messageId,
          },
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
          some: {
            message: {
              MessagesOnCases: {
                every: {
                  caseId: targetedCase.id,
                },
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

    const messagesOnCase = await prisma.messagesOnCases.findMany({
      where: {
        caseId: caseId,
      },
      include: {
        message: {
          include: {
            from: true,
            to: {
              include: {
                recipient: true,
              },
            },
            AttachmentsOnMessages: {
              include: {
                attachment: {
                  select: {
                    id: true,
                    contentType: true,
                    name: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      messages: await Promise.all(
        messagesOnCase.map(async (messageOnCase): Promise<MessageSchemaType> => {
          return await messagePrismaToModel({
            ...messageOnCase.message,
            consideredAsProcessed: messageOnCase.markedAsProcessed,
            from: messageOnCase.message.from,
            to: messageOnCase.message.to.map((toContact) => toContact.recipient),
            attachments: messageOnCase.message.AttachmentsOnMessages.map((aOnM) => ({
              ...aOnM.attachment,
              inline: aOnM.inline,
            })),
          });
        })
      ),
    };
  }),
});
