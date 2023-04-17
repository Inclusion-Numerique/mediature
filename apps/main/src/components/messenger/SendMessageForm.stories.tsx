import { Meta, StoryFn } from '@storybook/react';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { playFindForm } from '@mediature/docs/.storybook/testing';
import { SendMessageForm } from '@mediature/main/src/components/messenger/SendMessageForm';
import { contacts, messages } from '@mediature/main/src/fixtures/messenger';
import { SendMessagePrefillSchema } from '@mediature/main/src/models/actions/messenger';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';

type ComponentType = typeof SendMessageForm;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Forms/SendMessage',
  component: SendMessageForm,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock({
        type: 'mutation',
        path: ['sendMessage'],
        response: {
          message: messages[0],
        },
      }),
    ],
  },
};

const Template: StoryFn<ComponentType> = (args) => {
  return <SendMessageForm {...args} />;
};

const EmptyStory = Template.bind({});
EmptyStory.args = {
  recipientsSuggestions: contacts,
};
EmptyStory.parameters = { ...defaultMswParameters };
EmptyStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Empty = prepareStory(EmptyStory);

const FilledStory = Template.bind({});
FilledStory.args = {
  ...EmptyStory.args,
  prefill: SendMessagePrefillSchema.parse({
    caseId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
    to: messages[0].to.map((contact) => {
      return {
        email: contact.email,
        name: contact.name,
      };
    }),
    subject: messages[0].subject,
    content: messages[0].content,
    attachments: messages[0].attachments.map((attachment) => attachment.id),
  }),
};
FilledStory.parameters = { ...defaultMswParameters };
FilledStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Filled = prepareStory(FilledStory);
