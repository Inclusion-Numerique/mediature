import { Meta, StoryFn } from '@storybook/react';
import { within } from '@storybook/testing-library';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { reusableNormal as MessengerSenderNormalStory } from '@mediature/main/src/components/messenger/MessengerSender.stories';
import { MessengerViewer, MessengerViewerContext } from '@mediature/main/src/components/messenger/MessengerViewer';
import { messages } from '@mediature/main/src/fixtures/messenger';

type ComponentType = typeof MessengerViewer;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Components/MessengerViewer',
  component: MessengerViewer,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const Template: StoryFn<ComponentType> = (args) => {
  return <MessengerViewer {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  caseId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
  message: messages[0],
};
NormalStory.parameters = {};
NormalStory.play = async ({ canvasElement }) => {
  await within(canvasElement).findByRole('button', {
    name: /répondre/i,
  });
};

export const Normal = prepareStory(NormalStory, {
  childrenContext: {
    context: MessengerViewerContext,
    value: {
      ContextualMessengerSender: MessengerSenderNormalStory,
    },
  },
});
