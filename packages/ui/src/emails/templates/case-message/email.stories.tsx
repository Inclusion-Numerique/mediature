import { Meta, StoryFn } from '@storybook/react';

import { withEmailClientOverviewFactory, withEmailRenderer } from '@mediature/docs/.storybook/email';
import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { playFindEmailStructure } from '@mediature/docs/.storybook/testing';
import sampleAllElement from '@mediature/ui/src/Editor/sample-all-elements.lexical';
import { commonEmailsParameters } from '@mediature/ui/src/emails/storybook-utils';
import { CaseMessageEmail, formatTitle } from '@mediature/ui/src/emails/templates/case-message/email';
import { inlineEditorStateToHtml } from '@mediature/ui/src/utils/lexical';

type ComponentType = typeof CaseMessageEmail;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Emails/Templates/CaseMessage',
  component: CaseMessageEmail,
  ...generateMetaDefault({
    parameters: {
      ...commonEmailsParameters,
      docs: {
        description: {
          component: 'Email sent when an agent send a message',
        },
      },
    },
  }),
} as Meta<ComponentType>;

const Template: StoryFn<ComponentType> = (args) => {
  return <CaseMessageEmail {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  firstname: 'Thomas',
  lastname: 'Derrien',
  dossierIdentifier: '286',
  htmlMessageContent: inlineEditorStateToHtml(sampleAllElement),
  attachments: ['example.jpg', 'example2.pdf'],
};
NormalStory.parameters = {
  a11y: {
    // TODO: once solution found, adjust to exclude the email lexical content at the general level
    // Ref: https://github.com/storybookjs/storybook/issues/20813
    disable: true,
  },
};
NormalStory.decorators = [withEmailRenderer];
NormalStory.play = async ({ canvasElement }) => {
  await playFindEmailStructure(canvasElement);
};

export const Normal = prepareStory(NormalStory);

const ClientOverviewStory = Template.bind({});
ClientOverviewStory.args = {
  ...NormalStory.args,
};
ClientOverviewStory.decorators = [withEmailRenderer, withEmailClientOverviewFactory(formatTitle())];
ClientOverviewStory.play = async ({ canvasElement }) => {
  await playFindEmailStructure(canvasElement);
};

export const ClientOverview = prepareStory(ClientOverviewStory);
