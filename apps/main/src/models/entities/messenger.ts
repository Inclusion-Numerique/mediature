import z from 'zod';

import { UiAttachmentSchema } from '@mediature/main/src/models/entities/attachment';
import { EditorStateSchema } from '@mediature/main/src/models/entities/lexical';

export const ContactSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).nullable(),
  })
  .strict();
export type ContactSchemaType = z.infer<typeof ContactSchema>;

export const ContactInputSchema = z
  .object({
    email: ContactSchema.shape.email,
    name: ContactSchema.shape.name,
  })
  .strict();
export type ContactInputSchemaType = z.infer<typeof ContactInputSchema>;

export const MessageStatusSchema = z.enum(['PENDING', 'TRANSFERRED', 'ERROR']);
export type MessageStatusSchemaType = z.infer<typeof MessageStatusSchema>;

export const MessageSchema = z
  .object({
    id: z.string().uuid(),
    from: ContactSchema,
    to: z.array(ContactSchema).min(1),
    subject: z.string().min(1),
    content: EditorStateSchema,
    attachments: z.array(UiAttachmentSchema),
    status: MessageStatusSchema,
    consideredAsProcessed: z.boolean().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
  })
  .strict();
export type MessageSchemaType = z.infer<typeof MessageSchema>;
