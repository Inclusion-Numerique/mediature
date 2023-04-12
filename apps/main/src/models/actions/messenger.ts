import z from 'zod';

import { GetterInputSchema } from '@mediature/main/src/models/actions/common';
import { AttachmentInputSchema } from '@mediature/main/src/models/entities/attachment';
import { incompleteCaseSchema } from '@mediature/main/src/models/entities/case';
import { ContactInputSchema, MessageSchema } from '@mediature/main/src/models/entities/messenger';

export const sendMessageAttachmentsMax = 10;
export const SendMessageSchema = z
  .object({
    caseId: incompleteCaseSchema.shape.id,
    to: z.array(ContactInputSchema).min(1),
    subject: MessageSchema.shape.subject.min(1).max(255), // The max is specified according to https://www.theorchardagency.com.au/insights/subject-line-length-and-open-rates/
    content: MessageSchema.shape.content,
    attachments: z.array(AttachmentInputSchema).max(sendMessageAttachmentsMax),
  })
  .strict();
export type SendMessageSchemaType = z.infer<typeof SendMessageSchema>;

export const SendMessagePrefillSchema = SendMessageSchema.deepPartial();
export type SendMessagePrefillSchemaType = z.infer<typeof SendMessagePrefillSchema>;

export const UpdateMessageMetadataSchema = z
  .object({
    messageId: MessageSchema.shape.id,
    markAsProcessed: z.boolean().nullish(),
  })
  .strict();
export type UpdateMessageMetadataSchemaType = z.infer<typeof UpdateMessageMetadataSchema>;

export const UpdateMessageMetadataPrefillSchema = UpdateMessageMetadataSchema.deepPartial();
export type UpdateMessageMetadataPrefillSchemaType = z.infer<typeof UpdateMessageMetadataPrefillSchema>;

export const ListMessagesSchema = GetterInputSchema.extend({
  filterBy: z.object({
    query: z.string().nullish(),
    caseIds: z.array(incompleteCaseSchema.shape.id).nullish(),
    consideredAsProcessed: z.boolean().nullish(),
  }),
}).strict();
export type ListMessagesSchemaType = z.infer<typeof ListMessagesSchema>;

export const ListMessagesPrefillSchema = ListMessagesSchema.deepPartial();
export type ListMessagesPrefillSchemaType = z.infer<typeof ListMessagesPrefillSchema>;

export const GetMessageRecipientsSuggestionsSchema = z
  .object({
    caseId: incompleteCaseSchema.shape.id,
  })
  .strict();
export type GetMessageRecipientsSuggestionsSchemaType = z.infer<typeof GetMessageRecipientsSuggestionsSchema>;

// export const GetMessengerSummarySchema = z
//   .object({
//     authorityId: incompleteCaseSchema.shape.id.nullish(),
//     caseId: incompleteCaseSchema.shape.id.nullish(),
//   })
//   .strict();
// export type GetMessengerSummarySchemaType = z.infer<typeof GetMessengerSummarySchema>;
