import { Meta, StoryFn } from '@storybook/react';
import { userEvent, within } from '@storybook/testing-library';

import { userSessionContext } from '@mediature/docs/.storybook/auth';
import { ComponentProps, StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { playFindForm, playFindFormInMain, playFindProgressBar } from '@mediature/docs/.storybook/testing';
import { Normal as PrivateLayoutNormalStory } from '@mediature/main/src/app/(private)/PrivateLayout.stories';
import { Empty as AddNoteFormEmptyStory } from '@mediature/main/src/app/(private)/dashboard/authority/[authorityId]/case/sss/AddNoteForm.stories';
import { CasePage, CasePageContext } from '@mediature/main/src/app/(private)/dashboard/authority/[authorityId]/case/sss/CasePage';
import { Normal as NoteCardNormalStory } from '@mediature/main/src/components/NoteCard.stories';
import { cases, casesWrappers } from '@mediature/main/src/fixtures/case';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';

type ComponentType = typeof CasePage;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();

export default {
  title: 'Pages/Case',
  component: CasePage,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const mswListCasesParameters = {
  type: 'query' as 'query',
  path: ['getCase'] as ['getCase'],
  response: {
    caseWrapper: {
      ...casesWrappers[0],
      case: {
        ...casesWrappers[0].case,
        termReminderAt: new Date('December 20, 2022 03:24:00'),
      },
    },
  },
};

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock(mswListCasesParameters),
      getTRPCMock({
        type: 'mutation',
        path: ['updateCase'],
        response: { case: cases[0] },
      }),
    ],
  },
};

const commonComponentProps: ComponentProps<ComponentType> = {
  params: {
    authorityId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e01',
    caseId: 'b79cb3ba-745e-5d9a-8903-4a02327a7e05',
  },
};

const Template: StoryFn<ComponentType> = (args) => {
  return <CasePage {...args} />;
};

const NormalStory = Template.bind({});
NormalStory.args = {
  ...commonComponentProps,
};
NormalStory.parameters = { ...defaultMswParameters };
NormalStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Normal = prepareStory(NormalStory, {
  childrenContext: {
    context: CasePageContext,
    value: {
      ContextualNoteCard: NoteCardNormalStory,
      ContextualAddNoteForm: AddNoteFormEmptyStory,
    },
  },
});

const WithLayoutStory = Template.bind({});
WithLayoutStory.args = {
  ...commonComponentProps,
};
WithLayoutStory.parameters = {
  layout: 'fullscreen',
  ...defaultMswParameters,
};
WithLayoutStory.play = async ({ canvasElement }) => {
  await playFindFormInMain(canvasElement);
};

export const WithLayout = prepareStory(WithLayoutStory, {
  layoutStory: PrivateLayoutNormalStory,
  childrenContext: {
    context: CasePageContext,
    value: {
      ContextualNoteCard: NoteCardNormalStory,
      ContextualAddNoteForm: AddNoteFormEmptyStory,
    },
  },
});
