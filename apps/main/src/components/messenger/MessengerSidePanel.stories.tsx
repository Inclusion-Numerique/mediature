import { Meta, StoryFn } from '@storybook/react';
import { within } from '@storybook/testing-library';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { reusableNormal as MessengerSenderNormalStory } from '@mediature/main/src/components/messenger/MessengerSender.stories';
import { MessengerSidePanel, MessengerSidePanelContext } from '@mediature/main/src/components/messenger/MessengerSidePanel';
import { messages } from '@mediature/main/src/fixtures/messenger';

type ComponentType = typeof MessengerSidePanel;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Components/MessengerSidePanel',
  component: MessengerSidePanel,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const Template: StoryFn<ComponentType> = (args) => {
  return <MessengerSidePanel {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  caseId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
  messages: messages,
};
NormalStory.parameters = {};
NormalStory.play = async ({ canvasElement }) => {
  await within(canvasElement).findByRole('button', {
    name: /nouveau message/i,
  });
};

export const Normal = prepareStory(NormalStory, {
  childrenContext: {
    context: MessengerSidePanelContext,
    value: {
      ContextualMessengerSender: MessengerSenderNormalStory,
    },
  },
});
