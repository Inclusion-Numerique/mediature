import sampleContent from '@mediature/main/src/components/messenger/sample-content.lexical';
import { uiAttachments } from '@mediature/main/src/fixtures/attachment';
import {
  ContactSchema,
  ContactSchemaType,
  MessageSchema,
  MessageSchemaType,
  MessageStatusSchema,
} from '@mediature/main/src/models/entities/messenger';

export const contacts: ContactSchemaType[] = [
  ContactSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
    email: 'germaine38@hotmail.fr',
    name: 'Romain Garcia',
  }),
  ContactSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e02',
    email: 'justine.blanchard@hotmail.fr',
    name: null,
  }),
  ContactSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e03',
    email: 'aure.benoit71@hotmail.fr',
    name: 'Agathon Louis',
  }),
];

export const messages: MessageSchemaType[] = [
  MessageSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
    from: contacts[0],
    to: [contacts[1], contacts[2]],
    subject: 'Doloribus voluptate et',
    content: sampleContent,
    attachments: [uiAttachments[0], uiAttachments[1]],
    status: MessageStatusSchema.Values.TRANSFERRED,
    consideredAsProcessed: true,
    createdAt: new Date('December 17, 2022 03:24:00 UTC'),
    updatedAt: new Date('December 19, 2022 04:33:00 UTC'),
    deletedAt: null,
  }),
  MessageSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e02',
    from: contacts[1],
    to: [contacts[0]],
    subject: 'Quod modi maiores',
    content: sampleContent,
    attachments: [],
    status: MessageStatusSchema.Values.TRANSFERRED,
    consideredAsProcessed: true,
    createdAt: new Date('December 17, 2022 03:24:00 UTC'),
    updatedAt: new Date('December 19, 2022 04:33:00 UTC'),
    deletedAt: null,
  }),
  MessageSchema.parse({
    id: 'b79cb3ba-745e-5d9a-8903-4a02327a7e03',
    from: contacts[2],
    to: [contacts[0], contacts[1]],
    subject: 'Molestias distinctio sunt',
    content: sampleContent,
    attachments: [uiAttachments[1]],
    status: MessageStatusSchema.Values.TRANSFERRED,
    consideredAsProcessed: false,
    createdAt: new Date('December 17, 2022 03:24:00 UTC'),
    updatedAt: new Date('December 19, 2022 04:33:00 UTC'),
    deletedAt: null,
  }),
];
