import { renderToMjml } from '@luma-team/mjml-react';
import mjml2html from 'mjml';
import nodemailer, { Transporter } from 'nodemailer';
import type { Options as MailOptions } from 'nodemailer/lib/mailer/index';
import { Readable } from 'stream';

import {
  AdminRoleGrantedEmail,
  formatTitle as AdminRoleGrantedEmailFormatTitle,
  AdminRoleGrantedEmailProps,
} from '@mediature/ui/src/emails/templates/admin-role-granted/email';
import {
  AdminRoleRevokedEmail,
  formatTitle as AdminRoleRevokedEmailFormatTitle,
  AdminRoleRevokedEmailProps,
} from '@mediature/ui/src/emails/templates/admin-role-revoked/email';
import {
  AgentActivitySumUpEmail,
  formatTitle as AgentActivitySumUpEmailFormatTitle,
  AgentActivitySumUpEmailProps,
} from '@mediature/ui/src/emails/templates/agent-activity-sum-up/email';
import {
  AuthorityAgentRemovedEmail,
  formatTitle as AuthorityAgentRemovedEmailFormatTitle,
  AuthorityAgentRemovedEmailProps,
} from '@mediature/ui/src/emails/templates/authority-agent-removed/email';
import {
  CaseAssignedBySomeoneEmail,
  formatTitle as CaseAssignedBySomeoneEmailFormatTitle,
  CaseAssignedBySomeoneEmailProps,
} from '@mediature/ui/src/emails/templates/case-assigned-by-someone/email';
import {
  CaseClosedEmail,
  formatTitle as CaseClosedEmailFormatTitle,
  CaseClosedEmailProps,
} from '@mediature/ui/src/emails/templates/case-closed/email';
import {
  CaseMessageToRequesterEmail,
  formatTitle as CaseMessageToRequesterEmailFormatTitle,
  CaseMessageToRequesterEmailProps,
} from '@mediature/ui/src/emails/templates/case-message-to-requester/email';
import {
  CaseMessageEmail,
  formatTitle as CaseMessageEmailFormatTitle,
  CaseMessageEmailProps,
} from '@mediature/ui/src/emails/templates/case-message/email';
import {
  CaseRequestConfirmationEmail,
  formatTitle as CaseRequestConfirmationEmailFormatTitle,
  CaseRequestConfirmationEmailProps,
} from '@mediature/ui/src/emails/templates/case-request-confirmation/email';
import {
  NewPasswordRequestEmail,
  formatTitle as NewPasswordRequestEmailFormatTitle,
  NewPasswordRequestEmailProps,
} from '@mediature/ui/src/emails/templates/new-password-request/email';
import {
  PasswordChangedEmail,
  formatTitle as PasswordChangedEmailFormatTitle,
  PasswordChangedEmailProps,
} from '@mediature/ui/src/emails/templates/password-changed/email';
import {
  PasswordResetEmail,
  formatTitle as PasswordResetEmailFormatTitle,
  PasswordResetEmailProps,
} from '@mediature/ui/src/emails/templates/password-reset/email';
import {
  SignUpConfirmationEmail,
  formatTitle as SignUpConfirmationEmailFormatTitle,
  SignUpConfirmationEmailProps,
} from '@mediature/ui/src/emails/templates/sign-up-confirmation/email';
import {
  SignUpInvitationAsAdminEmail,
  formatTitle as SignUpInvitationAsAdminEmailFormatTitle,
  SignUpInvitationAsAdminEmailProps,
} from '@mediature/ui/src/emails/templates/sign-up-invitation-as-admin/email';
import {
  SignUpInvitationAsAgentEmail,
  formatTitle as SignUpInvitationAsAgentEmailFormatTitle,
  SignUpInvitationAsAgentEmailProps,
} from '@mediature/ui/src/emails/templates/sign-up-invitation-as-agent/email';
import {
  UserDeletedEmail,
  formatTitle as UserDeletedEmailFormatTitle,
  UserDeletedEmailProps,
} from '@mediature/ui/src/emails/templates/user-deleted/email';
import {
  WelcomeAuthorityAgentEmail,
  formatTitle as WelcomeAuthorityAgentEmailFormatTitle,
  WelcomeAuthorityAgentEmailProps,
} from '@mediature/ui/src/emails/templates/welcome-authority-agent/email';
import { convertHtmlEmailToText } from '@mediature/ui/src/utils/email';

export interface EmailServerSettings {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface MailerOptions {
  defaultSender: string;
  smtp: EmailServerSettings;
  fallbackSmtp?: EmailServerSettings;
  domainsToCatch?: string[]; // Useful in development environment to avoid sending emails to demo accounts (to not stain domain reputation)
}

export interface Attachment {
  contentType: string;
  filename?: string;
  content: string | Buffer | Readable;
}

export interface SendOptions {
  sender?: string;
  recipients: string[];
  subject: string;
  emailComponent: JSX.Element;
  attachments?: Attachment[];
}

export class Mailer {
  protected transporter: Transporter;
  protected fallbackTransporter: Transporter | null = null;
  protected defaultSender: string;
  protected domainsToCatch?: string[];

  constructor(options: MailerOptions) {
    this.defaultSender = options.defaultSender;
    this.domainsToCatch = options.domainsToCatch;

    this.transporter = nodemailer.createTransport({
      host: options.smtp.host,
      port: options.smtp.port,
      auth: {
        user: options.smtp.user,
        pass: options.smtp.password,
      },
    });

    if (options.fallbackSmtp) {
      this.fallbackTransporter = nodemailer.createTransport({
        host: options.fallbackSmtp.host,
        port: options.fallbackSmtp.port,
        auth: {
          user: options.fallbackSmtp.user,
          pass: options.fallbackSmtp.password,
        },
      });
    }
  }

  public close() {
    this.transporter.removeAllListeners();
    this.transporter.close();

    if (this.fallbackTransporter) {
      this.fallbackTransporter.removeAllListeners();
      this.fallbackTransporter.close();
    }
  }

  protected async send(options: SendOptions) {
    // Check if sending the email should be skipped or not
    if (this.domainsToCatch && this.domainsToCatch.length) {
      options.recipients = options.recipients.filter((recipient) => {
        const recipientDomain = recipient.split('@').pop();

        if (!recipientDomain || (this.domainsToCatch as string[]).includes(recipientDomain)) {
          console.log(`sending an email to ${recipient} is skipped due to his email domain being voluntarily catched`);

          return false;
        }

        return true;
      });
    }

    if (options.recipients.length === 0) {
      return;
    }

    const mjmlHtmlContent = renderToMjml(options.emailComponent);
    const transformResult = mjml2html(mjmlHtmlContent);

    if (transformResult.errors) {
      for (const err of transformResult.errors) {
        throw err;
      }
    }

    const rawHtmlVersion = transformResult.html;
    const plaintextVersion = convertHtmlEmailToText(rawHtmlVersion);

    const parameters: MailOptions = {
      from: options.sender || this.defaultSender,
      to: options.recipients.join(','),
      subject: options.subject,
      html: rawHtmlVersion,
      text: plaintextVersion,
      attachments: options.attachments ? options.attachments : undefined,
    };

    try {
      await this.transporter.sendMail(parameters);
    } catch (err) {
      console.error('the first attempt to send the email has failed');
      console.error(err);

      const retryTransporter = this.fallbackTransporter || this.transporter;

      try {
        await retryTransporter.sendMail(parameters);
      } catch (err) {
        console.error('the second attempt to send the email has failed');
        console.error(err);
      }
    }
  }

  public async sendSignUpConfirmation(parameters: SignUpConfirmationEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: SignUpConfirmationEmailFormatTitle(),
      emailComponent: SignUpConfirmationEmail(parameters),
    });
  }

  public async sendAdminRoleGranted(parameters: AdminRoleGrantedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: AdminRoleGrantedEmailFormatTitle(),
      emailComponent: AdminRoleGrantedEmail(parameters),
    });
  }

  public async sendAdminRoleRevoked(parameters: AdminRoleRevokedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: AdminRoleRevokedEmailFormatTitle(),
      emailComponent: AdminRoleRevokedEmail(parameters),
    });
  }

  public async sendAgentActivitySumUp(parameters: AgentActivitySumUpEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: AgentActivitySumUpEmailFormatTitle(),
      emailComponent: AgentActivitySumUpEmail(parameters),
    });
  }

  public async sendAuthorityAgentRemoved(parameters: AuthorityAgentRemovedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: AuthorityAgentRemovedEmailFormatTitle(),
      emailComponent: AuthorityAgentRemovedEmail(parameters),
    });
  }

  public async sendCaseAssignedBySomeone(parameters: CaseAssignedBySomeoneEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: CaseAssignedBySomeoneEmailFormatTitle(),
      emailComponent: CaseAssignedBySomeoneEmail(parameters),
    });
  }

  public async sendCaseClosed(parameters: CaseClosedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: CaseClosedEmailFormatTitle(),
      emailComponent: CaseClosedEmail(parameters),
    });
  }

  public async sendCaseMessageToRequester(parameters: CaseMessageToRequesterEmailProps & { recipients: string[] }) {
    await this.send({
      recipients: parameters.recipients,
      subject: CaseMessageToRequesterEmailFormatTitle(),
      emailComponent: CaseMessageToRequesterEmail(parameters),
      attachments: parameters.attachments,
    });
  }

  public async sendCaseMessage(parameters: CaseMessageEmailProps & { recipients: string[] }) {
    await this.send({
      recipients: parameters.recipients,
      subject: CaseMessageEmailFormatTitle(),
      emailComponent: CaseMessageEmail(parameters),
      attachments: parameters.attachments,
    });
  }

  public async sendCaseRequestConfirmation(parameters: CaseRequestConfirmationEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: CaseRequestConfirmationEmailFormatTitle(),
      emailComponent: CaseRequestConfirmationEmail(parameters),
    });
  }

  public async sendNewPasswordRequest(parameters: NewPasswordRequestEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: NewPasswordRequestEmailFormatTitle(),
      emailComponent: NewPasswordRequestEmail(parameters),
    });
  }

  public async sendPasswordChanged(parameters: PasswordChangedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: PasswordChangedEmailFormatTitle(),
      emailComponent: PasswordChangedEmail(parameters),
    });
  }

  public async sendPasswordReset(parameters: PasswordResetEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: PasswordResetEmailFormatTitle(),
      emailComponent: PasswordResetEmail(parameters),
    });
  }

  public async sendSignUpInvitationAsAdmin(parameters: SignUpInvitationAsAdminEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: SignUpInvitationAsAdminEmailFormatTitle(),
      emailComponent: SignUpInvitationAsAdminEmail(parameters),
    });
  }

  public async sendSignUpInvitationAsAgent(parameters: SignUpInvitationAsAgentEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: SignUpInvitationAsAgentEmailFormatTitle(),
      emailComponent: SignUpInvitationAsAgentEmail(parameters),
    });
  }

  public async sendUserDeleted(parameters: UserDeletedEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: UserDeletedEmailFormatTitle(),
      emailComponent: UserDeletedEmail(parameters),
    });
  }

  public async sendWelcomeAuthorityAgent(parameters: WelcomeAuthorityAgentEmailProps & { recipient: string }) {
    await this.send({
      recipients: [parameters.recipient],
      subject: WelcomeAuthorityAgentEmailFormatTitle(),
      emailComponent: WelcomeAuthorityAgentEmail(parameters),
    });
  }
}

export const mailer = new Mailer({
  defaultSender: `Médiature <noreply@${process.env.MAILER_DEFAULT_DOMAIN || ''}>`,
  smtp: {
    host: process.env.MAILER_SMTP_HOST || '',
    port: process.env.MAILER_SMTP_PORT ? parseInt(process.env.MAILER_SMTP_PORT, 10) : 0,
    user: process.env.MAILER_SMTP_USER || '',
    password: process.env.MAILER_SMTP_PASSWORD || '',
  },
  fallbackSmtp: !!process.env.MAILER_FALLBACK_SMTP_HOST
    ? {
        host: process.env.MAILER_FALLBACK_SMTP_HOST || '',
        port: process.env.MAILER_FALLBACK_SMTP_PORT ? parseInt(process.env.MAILER_FALLBACK_SMTP_PORT, 10) : 0,
        user: process.env.MAILER_FALLBACK_SMTP_USER || '',
        password: process.env.MAILER_FALLBACK_SMTP_PASSWORD || '',
      }
    : undefined,
  domainsToCatch:
    !!process.env.MAILER_DOMAINS_TO_CATCH && process.env.MAILER_DOMAINS_TO_CATCH !== '' ? process.env.MAILER_DOMAINS_TO_CATCH.split(',') : undefined,
});
