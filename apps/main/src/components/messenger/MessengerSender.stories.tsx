import Button from '@mui/material/Button';
import { Meta, StoryFn } from '@storybook/react';
import { screen, userEvent, within } from '@storybook/testing-library';
import { EventEmitter } from 'eventemitter3';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { MessengerSender, MessengerSenderContext } from '@mediature/main/src/components/messenger/MessengerSender';
import { Empty as SendMessageFormEmptyStory } from '@mediature/main/src/components/messenger/SendMessageForm.stories';
import { contacts } from '@mediature/main/src/fixtures/messenger';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';

type ComponentType = typeof MessengerSender;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Components/MessengerSender',
  component: MessengerSender,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock({
        type: 'query',
        path: ['getMessageRecipientsSuggestions'],
        response: {
          recipientsSuggestions: contacts,
        },
      }),
    ],
  },
};

async function playOpenAndFindElement(canvasElement: HTMLElement): Promise<HTMLElement> {
  const button = await within(canvasElement).findByRole('button', {
    name: /display/i,
  });

  // Needed otherwise `MessengerSender` has not yet enabled its click listener of `eventEmitter`
  await new Promise((resolve) => setTimeout(resolve, 100));

  await userEvent.click(button);

  const dialog = await screen.findByRole('dialog');
  return await within(dialog).findByRole('button', {
    name: /envoyer/i,
  });
}

const Template: StoryFn<typeof MessengerSender> = (args) => {
  const eventEmitter = new EventEmitter();

  args.eventEmitter = eventEmitter;

  return (
    <>
      <MessengerSender {...args} />
      <Button
        onClick={(event) => {
          eventEmitter.emit('click', event);
        }}
        variant="contained"
      >
        Display the new message dialog
      </Button>
    </>
  );
};

const reusableTemplate: StoryFn<typeof MessengerSender> = (args) => {
  return <MessengerSender {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  caseId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
};
NormalStory.parameters = {
  ...defaultMswParameters,
};
NormalStory.play = async ({ canvasElement }) => {
  await playOpenAndFindElement(canvasElement);
};

export const Normal = prepareStory(NormalStory, {
  childrenContext: {
    context: MessengerSenderContext,
    value: {
      ContextualSendMessageForm: SendMessageFormEmptyStory,
    },
  },
});

const reusableNormalStory = reusableTemplate.bind({});
reusableNormalStory.args = {
  ...NormalStory.args,
};
reusableNormalStory.parameters = {
  ...NormalStory.parameters,
};

// eslint-disable-next-line storybook/prefer-pascal-case
export const reusableNormal = prepareStory(reusableNormalStory, {
  childrenContext: {
    context: MessengerSenderContext,
    value: {
      ContextualSendMessageForm: SendMessageFormEmptyStory,
    },
  },
});
