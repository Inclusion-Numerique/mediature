import { MjmlDivider, MjmlRaw, MjmlText } from '@luma-team/mjml-react';

import { useServerTranslation } from '@mediature/main/src/i18n';
import { StandardLayout } from '@mediature/ui/src/emails/layouts/standard';

export function formatTitle() {
  return `Nouveau message pour votre dossier`;
}

export interface CaseMessageEmailProps {
  firstname: string;
  lastname: string;
  caseIdentifier: string;
  htmlMessageContent: string;
  attachments?: string[]; // TODO
}

export function CaseMessageEmail(props: CaseMessageEmailProps) {
  const { t } = useServerTranslation('common');
  const title = formatTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>{title}</h1>
        <p>
          Bonjour {props.firstname} {props.lastname},
        </p>
        <p>Votre médiateur vient d&apos;apporter une nouvelle réponse à votre dossier n°{props.caseIdentifier}.</p>
        {!!props.attachments?.length && (
          <p
            dangerouslySetInnerHTML={{
              __html: t('email.template.CaseMessageEmail.attachmentsInThisEmail', { count: props.attachments.length }),
            }}
          />
        )}
      </MjmlText>
      <MjmlDivider />
      <MjmlText>
        <MjmlRaw>
          <div dangerouslySetInnerHTML={{ __html: props.htmlMessageContent }} />
        </MjmlRaw>
      </MjmlText>
      <MjmlDivider />
      <MjmlText>
        <p>À noter que vous pouvez apporter réponse directement en répondant à cet email.</p>
      </MjmlText>
    </StandardLayout>
  );
}
