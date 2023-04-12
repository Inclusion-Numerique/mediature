import {
  Address,
  Admin,
  Agent,
  Attachment,
  Authority,
  Case,
  CaseCompetentThirdPartyItem,
  CaseDomainItem,
  Citizen,
  Contact,
  Message,
  Note,
  Phone,
  User,
} from '@prisma/client';

import { UiAttachmentSchemaType } from '@mediature/main/src/models/entities/attachment';
import { AuthoritySchemaType } from '@mediature/main/src/models/entities/authority';
import {
  CaseCompetentThirdPartyItemSchemaType,
  CaseDomainItemSchemaType,
  CaseNoteSchemaType,
  CaseSchemaType,
} from '@mediature/main/src/models/entities/case';
import { CitizenSchemaType } from '@mediature/main/src/models/entities/citizen';
import { ContactInputSchemaType, ContactSchemaType, MessageSchemaType } from '@mediature/main/src/models/entities/messenger';
import { UserSchemaType } from '@mediature/main/src/models/entities/user';
import { fileAuthSecret, generateSignedAttachmentLink } from '@mediature/main/src/server/routers/common/attachment';

export function userPrismaToModel(user: User): UserSchemaType {
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    status: user.status,
    profilePicture: user.profilePicture,
    lastActivityAt: user.lastActivityAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
  };
}

export function adminPrismaToModel(
  admin: Admin & {
    user: User;
  }
) {
  return {
    id: admin.id,
    userId: admin.userId,
    firstname: admin.user.firstname,
    lastname: admin.user.lastname,
    email: admin.user.email,
    profilePicture: admin.user.profilePicture,
    canEverything: admin.canEverything,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    deletedAt: admin.deletedAt,
  };
}

export function agentPrismaToModel(
  agent: Agent & {
    user: User;
    AuthorityWhereMainAgent: { id: string } | null;
  }
) {
  return {
    id: agent.id,
    userId: agent.userId,
    authorityId: agent.authorityId,
    firstname: agent.user.firstname,
    lastname: agent.user.lastname,
    email: agent.user.email,
    profilePicture: agent.user.profilePicture,
    isMainAgent: !!agent.AuthorityWhereMainAgent,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    deletedAt: agent.deletedAt,
  };
}

export async function authorityPrismaToModel(authority: Authority): Promise<AuthoritySchemaType> {
  return {
    id: authority.id,
    name: authority.name,
    slug: authority.slug,
    mainAgentId: authority.mainAgentId,
    type: authority.type,
    logo: await attachmentIdPrismaToModel(authority.logoAttachmentId),
    createdAt: authority.createdAt,
    updatedAt: authority.updatedAt,
    deletedAt: authority.deletedAt,
  };
}

export function caseDomainItemPrismaToModel(item: CaseDomainItem, parentItem?: CaseDomainItem): CaseDomainItemSchemaType {
  return {
    id: item.id,
    name: item.name,
    authorityId: item.authorityId,
    parentId: item.parentItemId,
    parentName: parentItem ? parentItem.name : null,
  };
}

export function caseDomainItemsPrismaToModel(items: CaseDomainItem[]): CaseDomainItemSchemaType[] {
  return items.map((item) => {
    let parentItem: CaseDomainItem | null = null;
    if (item.parentItemId) {
      parentItem =
        items.find((iterableItem) => {
          return iterableItem.id === item.parentItemId;
        }) || null;

      if (!parentItem) {
        throw new Error('when mapping items you need to provide all the needed ones so children can be linked to parent items');
      }
    }

    return caseDomainItemPrismaToModel(item, parentItem || undefined);
  });
}

export function caseCompetentThirdPartyItemPrismaToModel(
  item: CaseCompetentThirdPartyItem,
  parentItem?: CaseCompetentThirdPartyItem
): CaseCompetentThirdPartyItemSchemaType {
  return {
    id: item.id,
    name: item.name,
    authorityId: item.authorityId,
    parentId: item.parentItemId,
    parentName: parentItem ? parentItem.name : null,
  };
}

export function caseCompetentThirdPartyItemsPrismaToModel(items: CaseCompetentThirdPartyItem[]): CaseCompetentThirdPartyItemSchemaType[] {
  return items.map((item) => {
    let parentItem: CaseCompetentThirdPartyItem | null = null;
    if (item.parentItemId) {
      parentItem =
        items.find((iterableItem) => {
          return iterableItem.id === item.parentItemId;
        }) || null;

      if (!parentItem) {
        throw new Error('when mapping items you need to provide all the needed ones so children can be linked to parent items');
      }
    }

    return caseCompetentThirdPartyItemPrismaToModel(item, parentItem || undefined);
  });
}

export function casePrismaToModel(
  targetedCase: Case & {
    domain?:
      | (CaseDomainItem & {
          parentItem: CaseDomainItem | null;
        })
      | null;
    competentThirdParty?:
      | (CaseCompetentThirdPartyItem & {
          parentItem: CaseCompetentThirdPartyItem | null;
        })
      | null;
  }
): CaseSchemaType {
  return {
    id: targetedCase.id,
    humanId: targetedCase.humanId,
    citizenId: targetedCase.citizenId,
    authorityId: targetedCase.authorityId,
    agentId: targetedCase.agentId,
    alreadyRequestedInThePast: targetedCase.alreadyRequestedInThePast,
    gotAnswerFromPreviousRequest: targetedCase.gotAnswerFromPreviousRequest,
    description: targetedCase.description,
    domain: !!targetedCase.domain ? caseDomainItemPrismaToModel(targetedCase.domain, targetedCase.domain.parentItem || undefined) : null,
    competent: targetedCase.competent,
    competentThirdParty: !!targetedCase.competentThirdParty
      ? caseCompetentThirdPartyItemPrismaToModel(targetedCase.competentThirdParty, targetedCase.competentThirdParty.parentItem || undefined)
      : null,
    units: targetedCase.units,
    emailCopyWanted: targetedCase.emailCopyWanted,
    termReminderAt: targetedCase.termReminderAt,
    initiatedFrom: targetedCase.initiatedFrom,
    status: targetedCase.status,
    closedAt: targetedCase.closedAt,
    outcome: targetedCase.outcome,
    collectiveAgreement: targetedCase.collectiveAgreement,
    administrativeCourtNext: targetedCase.administrativeCourtNext,
    finalConclusion: targetedCase.finalConclusion,
    nextRequirements: targetedCase.nextRequirements,
    createdAt: targetedCase.createdAt,
    updatedAt: targetedCase.updatedAt,
    deletedAt: targetedCase.deletedAt,
  };
}

export function citizenPrismaToModel(citizen: Citizen & { address: Address; phone: Phone }): CitizenSchemaType {
  return {
    id: citizen.id,
    email: citizen.email,
    firstname: citizen.firstname,
    lastname: citizen.lastname,
    address: citizen.address,
    phone: citizen.phone,
    createdAt: citizen.createdAt,
    updatedAt: citizen.updatedAt,
    deletedAt: citizen.deletedAt,
  };
}

export function caseNotePrismaToModel(note: Note): CaseNoteSchemaType {
  return {
    id: note.id,
    caseId: note.caseId,
    date: note.date,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
  };
}

export interface AttachmentPrismaInput {
  id: Attachment['id'];
  contentType?: Attachment['contentType'];
  size?: Attachment['size'];
  name?: Attachment['name'];
}

export async function attachmentPrismaToModel(attachment: AttachmentPrismaInput): Promise<UiAttachmentSchemaType> {
  return {
    id: attachment.id,
    url: await generateSignedAttachmentLink(attachment.id, fileAuthSecret),
    contentType: attachment.contentType,
    size: attachment.size,
    name: attachment.name,
  };
}

export async function attachmentIdPrismaToModel(attachmentId: null): Promise<null>;
export async function attachmentIdPrismaToModel(attachmentId: string): Promise<UiAttachmentSchemaType>;
export async function attachmentIdPrismaToModel(attachmentId: string | null): Promise<UiAttachmentSchemaType | null>;
export async function attachmentIdPrismaToModel(attachmentId: string | null): Promise<UiAttachmentSchemaType | null> {
  if (!attachmentId) {
    return null;
  }

  return await attachmentPrismaToModel({
    id: attachmentId,
  });
}

export function contactPrismaToModel(contact: Contact): ContactSchemaType {
  return {
    id: contact.id,
    email: contact.email,
    name: contact.name,
  };
}

export function contactInputPrismaToModel(contact: Contact): ContactInputSchemaType {
  return {
    email: contact.email,
    name: contact.name,
  };
}

export async function messagePrismaToModel(
  message: Message & {
    from: Contact;
    to: Contact[];
    attachments: {
      id: string;
      name: string | null;
    }[];
    consideredAsProcessed: boolean | null;
  }
): Promise<MessageSchemaType> {
  return {
    id: message.id,
    subject: message.subject,
    content: message.content,
    status: message.status,
    consideredAsProcessed: message.consideredAsProcessed,
    from: contactPrismaToModel(message.from),
    to: message.to.map((toContact) => contactPrismaToModel(toContact)),
    attachments: await Promise.all(
      message.attachments.map((attachment) => {
        return attachmentPrismaToModel({
          id: attachment.id,
          name: attachment.name,
        });
      })
    ),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt,
  };
}
