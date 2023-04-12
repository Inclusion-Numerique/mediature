import { Meta, StoryFn } from '@storybook/react';
import { within } from '@storybook/testing-library';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { MessengerMessageList } from '@mediature/main/src/components/messenger/MessengerMessageList';
import { messages } from '@mediature/main/src/fixtures/messenger';

type ComponentType = typeof MessengerMessageList;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Components/MessengerMessageList',
  component: MessengerMessageList,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const Template: StoryFn<ComponentType> = (args) => {
  return <MessengerMessageList {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  messages: messages,
};
NormalStory.parameters = {};
NormalStory.play = async ({ canvasElement }) => {
  await within(canvasElement).findAllByRole('button');
};

export const Normal = prepareStory(NormalStory);

const SelectedMessageStory = Template.bind({});
SelectedMessageStory.args = {
  messages: messages,
  selectedMessage: messages[1],
};
SelectedMessageStory.parameters = {};
SelectedMessageStory.play = async ({ canvasElement }) => {
  await within(canvasElement).findAllByRole('button');
};

export const SelectedMessage = prepareStory(SelectedMessageStory);
