import { MjmlDivider, MjmlRaw, MjmlText } from '@luma-team/mjml-react';

import { Attachment as EmailAttachment } from '@mediature/main/src/emails/mailer';
import { useServerTranslation } from '@mediature/main/src/i18n';
import { StandardLayout } from '@mediature/ui/src/emails/layouts/standard';

export function formatTitle() {
  return `Nouveau message pour votre dossier`;
}

export interface CaseMessageToRequesterEmailProps {
  subject: string;
  firstname: string;
  lastname: string;
  caseHumanId: string;
  htmlMessageContent: string;
  attachments?: EmailAttachment[];
}

export function CaseMessageToRequesterEmail(props: CaseMessageToRequesterEmailProps) {
  const { t } = useServerTranslation('common');
  const title = formatTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>{title}</h1>
        <p>
          Bonjour {props.firstname} {props.lastname},
        </p>
        <p>Votre médiateur vient d&apos;apporter une nouvelle réponse à votre dossier n°{props.caseHumanId}.</p>
        {!!props.attachments && props.attachments.length > 0 && (
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
