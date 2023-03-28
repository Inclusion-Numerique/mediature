import { Meta, StoryFn } from '@storybook/react';

import { StoryHelperFactory } from '@mediature/docs/.storybook/helpers';
import { playFindForm } from '@mediature/docs/.storybook/testing';
import { EditCaseCompetentThirdPartyItemForm } from '@mediature/main/src/components/EditCaseCompetentThirdPartyItemForm';
import { caseCompetentThirdParties } from '@mediature/main/src/fixtures/case';
import { EditCaseCompetentThirdPartyItemPrefillSchema } from '@mediature/main/src/models/actions/case';
import { getTRPCMock } from '@mediature/main/src/server/mock/trpc';

type ComponentType = typeof EditCaseCompetentThirdPartyItemForm;
const { generateMetaDefault, prepareStory } = StoryHelperFactory<ComponentType>();
export default {
  title: 'Forms/EditCaseCompetentThirdPartyItem',
  component: EditCaseCompetentThirdPartyItemForm,
  ...generateMetaDefault({
    parameters: {},
  }),
} as Meta<ComponentType>;

const defaultMswParameters = {
  msw: {
    handlers: [
      getTRPCMock({
        type: 'mutation',
        path: ['editCaseCompetentThirdPartyItem'],
        response: {
          item: caseCompetentThirdParties[0],
        },
      }),
    ],
  },
};

const Template: StoryFn<ComponentType> = (args) => {
  return <EditCaseCompetentThirdPartyItemForm {...args} />;
};

const EmptyStory = Template.bind({});
EmptyStory.args = {
  availableParentItems: caseCompetentThirdParties.filter((item) => !item.parentId),
  prefill: EditCaseCompetentThirdPartyItemPrefillSchema.parse({
    itemId: caseCompetentThirdParties[0].id,
  }),
};
EmptyStory.parameters = { ...defaultMswParameters };
EmptyStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Empty = prepareStory(EmptyStory);

const FilledStory = Template.bind({});
FilledStory.args = {
  ...EmptyStory.args,
  prefill: EditCaseCompetentThirdPartyItemPrefillSchema.parse({
    ...EmptyStory.args.prefill,
    parentId: caseCompetentThirdParties[1].id,
    name: 'My updated competent third-party',
  }),
};
FilledStory.parameters = { ...defaultMswParameters };
FilledStory.play = async ({ canvasElement }) => {
  await playFindForm(canvasElement);
};

export const Filled = prepareStory(FilledStory);
