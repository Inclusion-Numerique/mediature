import { Meta, StoryFn } from '@storybook/react';
import { within } from '@storybook/testing-library';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { Messenger, MessengerContext } from '@mediature/main/src/components/messenger/Messenger';
import { Normal as MessengerSidePanelNormalStory } from '@mediature/main/src/components/messenger/MessengerSidePanel.stories';
import { Normal as MessengerViewerNormalStory } from '@mediature/main/src/components/messenger/MessengerViewer.stories';
import { messages } from '@mediature/main/src/fixtures/messenger';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';

type ComponentType = typeof Messenger;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Components/Messenger',
  component: Messenger,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock({
        type: 'query',
        path: ['listMessages'],
        response: {
          messages: messages,
        },
      }),
    ],
  },
};

const Template: StoryFn<ComponentType> = (args) => {
  return <Messenger {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {};
NormalStory.parameters = {
  ...defaultMswParameters,
};
NormalStory.play = async ({ canvasElement }) => {
  await within(canvasElement).findByRole('button', {
    name: /nouveau message/i,
  });
};

export const Normal = prepareStory(NormalStory, {
  childrenContext: {
    context: MessengerContext,
    value: {
      ContextualMessengerSidePanel: MessengerSidePanelNormalStory,
      ContextualMessengerViewer: MessengerViewerNormalStory,
    },
  },
});
