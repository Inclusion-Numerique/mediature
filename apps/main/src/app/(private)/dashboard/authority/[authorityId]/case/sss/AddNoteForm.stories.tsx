import { Meta, StoryFn } from '@storybook/react';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { playFindForm } from '@mediature/docs/.storybook/testing';
import { AddNoteForm } from '@mediature/main/src/app/(private)/dashboard/authority/[authorityId]/case/sss/AddNoteForm';
import { notes } from '@mediature/main/src/fixtures/case';
import { AddNoteToCasePrefillSchema } from '@mediature/main/src/models/actions/case';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';
import sampleHello from '@mediature/ui/src/Editor/sample-hello.lexical';

type ComponentType = typeof AddNoteForm;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Forms/AddNote',
  component: AddNoteForm,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock({
        type: 'mutation',
        path: ['addNoteToCase'],
        response: {
          note: notes[0],
        },
      }),
    ],
  },
};

const Template: StoryFn<ComponentType> = (args) => {
  return <AddNoteForm {...args} />;
};

const EmptyStory = Template.bind({});
EmptyStory.args = {
  prefill: {
    caseId: '00000000-0000-0000-0000-000000000000',
  },
};
EmptyStory.parameters = { ...defaultMswParameters };
EmptyStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Empty = prepareStory(EmptyStory);

const FilledStory = Template.bind({});
FilledStory.args = {
  prefill: AddNoteToCasePrefillSchema.parse({
    caseId: '00000000-0000-0000-0000-000000000000',
    date: new Date('December 15, 2022 03:24:00'),
    content: sampleHello,
  }),
};
FilledStory.parameters = { ...defaultMswParameters };
FilledStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Filled = prepareStory(FilledStory);
