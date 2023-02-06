import { Note } from '@prisma/client';

import { prisma } from '@mediature/main/prisma/client';
import { mailer } from '@mediature/main/src/emails/mailer';
import {
  AddAttachmentToCaseSchema,
  AddNoteToCaseSchema,
  AssignCaseSchema,
  GeneratePdfFromCaseSchema,
  GetCaseSchema,
  ListCasesSchema,
  RemoveAttachmentFromCaseSchema,
  RemoveNoteFromCaseSchema,
  RequestCaseSchema,
  UnassignCaseSchema,
  UpdateCaseAttachmentLabelSchema,
  UpdateCaseNoteSchema,
  UpdateCaseSchema,
} from '@mediature/main/src/models/actions/case';
import { CasePlatformSchema, CaseStatusSchema, CaseWrapperSchema, CaseWrapperSchemaType } from '@mediature/main/src/models/entities/case';
import { PhoneTypeSchema } from '@mediature/main/src/models/entities/phone';
import { isUserAnAdmin } from '@mediature/main/src/server/routers/authority';
import { caseNotePrismaToModel, casePrismaToModel, citizenPrismaToModel } from '@mediature/main/src/server/routers/mappers';
import { privateProcedure, publicProcedure, router } from '@mediature/main/src/server/trpc';
import { linkRegistry } from '@mediature/main/src/utils/routes/registry';

export async function isAgentPartOfAuthority(authorityId: string, agentId: string): Promise<boolean> {
  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      authorityId: authorityId,
    },
  });

  return !!agent;
}

export async function isUserAnAgentPartOfAuthorities(authorityIds: string[], userId: string): Promise<boolean> {
  // Remove duplicates
  authorityIds = authorityIds.filter((x, i, a) => a.indexOf(x) == i);

  const authoritiesCount = await prisma.authority.count({
    where: {
      id: {
        in: authorityIds,
      },
      Agent: {
        some: {
          user: {
            id: userId,
          },
        },
      },
    },
  });

  return authorityIds.length === authoritiesCount;
}

export async function isUserAnAgentPartOfAuthority(authorityId: string, userId: string): Promise<boolean> {
  return await isUserAnAgentPartOfAuthorities([authorityId], userId);
}

export async function isAgentThisUser(userId: string, agentId: string): Promise<boolean> {
  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      userId: userId,
    },
  });

  return !!agent;
}

export async function canUserManageThisCase(userId: string, caseId: string): Promise<boolean> {
  const targetedCase = await prisma.case.findFirst({
    where: {
      id: caseId,
    },
  });
  if (!targetedCase) {
    throw new Error(`ce dossier n'existe pas`);
  }

  // if (!targetedCase.agentId || !(await isAgentThisUser(userId, targetedCase.agentId))) {
  //   throw new Error(`vous pouvez ajouter une note seulement si vous êtes assigné au dossier`);
  // }

  return true;
}

export const caseRouter = router({
  requestCase: publicProcedure.input(RequestCaseSchema).mutation(async ({ ctx, input }) => {
    const newCase = await prisma.case.create({
      data: {
        alreadyRequestedInThePast: input.alreadyRequestedInThePast,
        gotAnswerFromPreviousRequest: input.gotAnswerFromPreviousRequest,
        description: input.description,
        units: '', // TODO
        emailCopyWanted: input.emailCopyWanted,
        termReminderAt: null,
        initiatedFrom: CasePlatformSchema.Values.WEB,
        status: CaseStatusSchema.Values.TO_PROCESS,
        closedAt: null,
        finalConclusion: null,
        nextRequirements: null,
        citizen: {
          // TODO: get real address/phone from the form
          create: {
            email: input.email,
            firstname: input.firstname,
            lastname: input.lastname,
            address: {
              create: {
                street: '',
                city: '',
                postalCode: '',
                countryCode: '',
                subdivision: '',
              },
            },
            phone: {
              create: {
                phoneType: PhoneTypeSchema.Values.UNSPECIFIED,
                callingCode: '',
                countryCode: '',
                number: '',
              },
            },
          },
        },
        authority: {
          connect: {
            id: input.authorityId,
          },
        },
      },
      include: {
        citizen: true,
        authority: true,
      },
    });

    await mailer.sendCaseRequestConfirmation({
      recipient: newCase.citizen.email,
      firstname: newCase.citizen.firstname,
      lastname: newCase.citizen.lastname,
      caseHumanId: newCase.humanId.toString(),
      authorityName: newCase.authority.name,
    });

    // TODO: since public should return almost nothing? or nothing at all

    return {
      case: casePrismaToModel(newCase),
    };
  }),
  updateCase: privateProcedure.input(UpdateCaseSchema).mutation(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findUnique({
      where: {
        id: input.caseId,
      },
      include: {
        citizen: true,
        authority: true,
      },
    });

    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    if (!(await isUserAnAgentPartOfAuthority(targetedCase.authorityId, ctx.user.id))) {
      throw new Error(`vous devez faire partie de la collectivité de ce dossier pour le mettre à jour`);
    }

    let closedAt: Date | null = null;
    let statusSwitchedToClose = false;
    if (input.close) {
      if (targetedCase.closedAt) {
        closedAt = targetedCase.closedAt;
      } else {
        closedAt = new Date();
        statusSwitchedToClose = true;
      }
    }

    const updatedCase = await prisma.case.update({
      where: {
        id: input.caseId,
      },
      data: {
        initiatedFrom: input.initiatedFrom,
        units: input.units,
        termReminderAt: input.termReminderAt,
        status: input.status,
        closedAt: closedAt,
        finalConclusion: input.finalConclusion,
        nextRequirements: input.nextRequirements,
      },
    });

    if (statusSwitchedToClose) {
      await mailer.sendCaseClosed({
        recipient: targetedCase.citizen.email,
        firstname: targetedCase.citizen.firstname,
        lastname: targetedCase.citizen.lastname,
        caseHumanId: targetedCase.humanId.toString(),
        authorityName: targetedCase.authority.name,
      });
    }

    return { case: updatedCase };
  }),
  assignCase: privateProcedure.input(AssignCaseSchema).mutation(async ({ ctx, input }) => {
    // TODO: maybe better to use userId instead of agentId?
    const agentIdToAssign = input.agentIds[0];

    const targetedCase = await prisma.case.findFirst({
      where: {
        id: input.caseId,
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    if (targetedCase.agentId) {
      throw new Error(`un agent est déjà assigné sur ce dossier, il doit d'abord s'enlever pour que assigner une autre personne`);
    }

    if (!(await isAgentPartOfAuthority(targetedCase.authorityId, agentIdToAssign))) {
      throw new Error(`impossible d'assigner un agent qui ne fait pas partie de la collectivité du dossier`);
    }

    if (!(await isAgentThisUser(ctx.user.id, agentIdToAssign))) {
      throw new Error(`vous ne pouvez assigner que vous-même à un dossier`);

      // await mailer.sendCaseAssignedBySomeone({
      //   recipient: assignedUser.email,
      //   firstname: assignedUser.firstname,
      //   originatorFirstname: originatorUser.firstname,
      //   originatorLastname: originatorUser.lastname,
      //   caseUrl: linkRegistry.get('case', { authorityId: targetedCase.authorityId, caseId: targetedCase.id }, { absolute: true }),
      //   caseHumanId: targetedCase.humanId.toString(),
      // });
    }

    const assignedCase = await prisma.case.update({
      where: {
        id: input.caseId,
      },
      data: {
        agent: {
          connect: {
            id: agentIdToAssign,
          },
        },
      },
    });

    return { case: assignedCase };
  }),
  unassignCase: privateProcedure.input(UnassignCaseSchema).mutation(async ({ ctx, input }) => {
    // TODO: maybe better to use userId instead of agentId?
    const agentIdToUnassign = input.agentIds[0];

    const targetedCase = await prisma.case.findFirst({
      where: {
        id: input.caseId,
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    if (!targetedCase.agentId) {
      throw new Error(`aucun agent n'est assigné sur ce dossier`);
    }

    if (!(await isAgentThisUser(ctx.user.id, agentIdToUnassign))) {
      throw new Error(`vous ne pouvez désassigner que vous-même d'un dossier`);
    }

    const assignedCase = await prisma.case.update({
      where: {
        id: input.caseId,
      },
      data: {
        agent: {
          disconnect: true,
        },
      },
    });

    return { case: assignedCase };
  }),
  getCase: privateProcedure.input(GetCaseSchema).query(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findUnique({
      where: {
        id: input.id,
      },
      include: {
        citizen: true,
        Note: true,
      },
    });

    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    } else if (!(await isUserAnAgentPartOfAuthority(targetedCase.authorityId, ctx.user.id))) {
      throw new Error(`en tant qu'agent vous ne pouvez qu'accéder aux dossiers concernant votre collectivité`);
    }

    return {
      caseWrapper: {
        case: casePrismaToModel(targetedCase),
        citizen: citizenPrismaToModel(targetedCase.citizen),
        notes: targetedCase.Note.map((note: Note) => caseNotePrismaToModel(note)),
      },
    };
  }),
  listCases: privateProcedure.input(ListCasesSchema).query(async ({ ctx, input }) => {
    const isAdmin = await isUserAnAdmin(ctx.user.id);

    if (!isAdmin) {
      if (
        !input.filterBy.authorityIds ||
        input.filterBy.authorityIds.length !== 1 ||
        !(await isUserAnAgentPartOfAuthorities(input.filterBy.authorityIds, ctx.user.id))
      ) {
        throw new Error(`en tant qu'agent vous ne pouvez que rechercher les dossiers concernant votre collectivité`);
      }
    }

    let humandIdSearch: number | undefined;
    if (input.filterBy.query) {
      const value = parseInt(input.filterBy.query);

      if (!isNaN(value)) {
        humandIdSearch = value;
      }
    }

    const cases = await prisma.case.findMany({
      where: {
        authorityId: input.filterBy.authorityIds
          ? {
              in: input.filterBy.authorityIds,
            }
          : undefined,
        humanId: input.filterBy.query
          ? {
              equals: humandIdSearch,
            }
          : undefined,
        description: input.filterBy.query
          ? {
              search: input.filterBy.query,
              mode: 'insensitive',
            }
          : undefined,
        citizen: {
          // TODO: concatenate the 2 columns in the DB and search on it
          firstname: input.filterBy.query
            ? {
                search: input.filterBy.query,
                mode: 'insensitive',
              }
            : undefined,
          lastname: input.filterBy.query
            ? {
                search: input.filterBy.query,
                mode: 'insensitive',
              }
            : undefined,
        },
        agent: {
          is: input.filterBy.assigned === false ? null : undefined,
          isNot: input.filterBy.assigned === false ? null : undefined,
        },
      },
      include: {
        citizen: true,
      },
    });

    return {
      casesWrappers: cases.map((iterationCase): CaseWrapperSchemaType => {
        return {
          case: casePrismaToModel(iterationCase),
          citizen: citizenPrismaToModel(iterationCase.citizen),
          notes: null,
        };
      }),
    };
  }),
  generatePdfFromCase: privateProcedure.input(GeneratePdfFromCaseSchema).mutation(async ({ ctx, input }) => {
    // TODO
    input.caseId;

    return true;
  }),
  addNoteToCase: privateProcedure.input(AddNoteToCaseSchema).mutation(async ({ ctx, input }) => {
    await canUserManageThisCase(ctx.user.id, input.caseId);

    const note = await prisma.note.create({
      data: {
        date: input.date,
        content: input.content,
        case: {
          connect: {
            id: input.caseId,
          },
        },
      },
    });

    return { note: note };
  }),
  removeNoteFromCase: privateProcedure.input(RemoveNoteFromCaseSchema).mutation(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findFirst({
      where: {
        Note: {
          every: {
            id: {
              equals: input.noteId,
            },
          },
        },
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    await canUserManageThisCase(ctx.user.id, targetedCase.id);

    const note = await prisma.note.delete({
      where: {
        id: input.noteId,
      },
    });

    return;
  }),
  updateCaseNote: privateProcedure.input(UpdateCaseNoteSchema).mutation(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findFirst({
      where: {
        Note: {
          every: {
            id: {
              equals: input.noteId,
            },
          },
        },
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    await canUserManageThisCase(ctx.user.id, targetedCase.id);

    const note = await prisma.note.update({
      where: {
        id: input.noteId,
      },
      data: {
        date: input.date,
        content: input.content,
      },
    });

    return { note };
  }),
  addAttachmentToCase: privateProcedure.input(AddAttachmentToCaseSchema).mutation(async ({ ctx, input }) => {
    await canUserManageThisCase(ctx.user.id, input.caseId);

    const targetedCase = await prisma.case.update({
      where: {
        id: input.caseId,
      },
      data: {
        AttachmentsOnCases: {
          create: {
            transmitter: input.transmitter,
            attachment: {
              connect: {
                // TODO: for all uploads, pass aId or the unique fileUrl?
                id: input.attachmentId,
              },
            },
          },
        },
      },
    });

    return;
  }),
  removeAttachmentFromCase: privateProcedure.input(RemoveAttachmentFromCaseSchema).mutation(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findFirst({
      where: {
        AttachmentsOnCases: {
          every: {
            attachmentId: {
              equals: input.attachmentId,
            },
          },
        },
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    await canUserManageThisCase(ctx.user.id, targetedCase.id);

    const attachment = await prisma.attachment.delete({
      where: {
        id: input.attachmentId,
      },
    });

    return;
  }),
  updateCaseAttachment: privateProcedure.input(UpdateCaseAttachmentLabelSchema).mutation(async ({ ctx, input }) => {
    const targetedCase = await prisma.case.findFirst({
      where: {
        AttachmentsOnCases: {
          every: {
            attachmentId: {
              equals: input.attachmentId,
            },
          },
        },
      },
    });
    if (!targetedCase) {
      throw new Error(`ce dossier n'existe pas`);
    }

    await canUserManageThisCase(ctx.user.id, targetedCase.id);

    await prisma.attachmentsOnCases.update({
      where: {
        caseId_attachmentId: {
          caseId: targetedCase.id,
          attachmentId: input.attachmentId,
        },
      },
      data: {
        transmitter: input.transmitter,
      },
    });

    return;
  }),
});
