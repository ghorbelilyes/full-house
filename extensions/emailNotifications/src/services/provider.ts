import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import {
  EmailNotificationSettings,
  EmailProviderCode
} from './constants.js';
import { getProviderSecret } from './settings.js';

export type ProviderEmail = {
  to: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, any>;
};

function formatAddress(email: string, name?: string) {
  if (!name) return email;
  return `"${name.replace(/"/g, '')}" <${email}>`;
}

function resolveSender(settings: EmailNotificationSettings, message: ProviderEmail) {
  const provider = settings.activeProvider;
  if (provider === 'smtp') {
    return {
      email:
        message.from ||
        settings.smtp.fromEmail ||
        settings.senderEmail,
      name:
        message.fromName ||
        settings.smtp.fromName ||
        settings.senderName,
      replyTo:
        message.replyTo ||
        settings.smtp.replyToEmail ||
        settings.replyToEmail
    };
  }

  return {
    email:
      message.from ||
      settings.sendgrid.fromEmail ||
      settings.senderEmail,
    name:
      message.fromName ||
      settings.sendgrid.fromName ||
      settings.senderName,
    replyTo:
      message.replyTo ||
      settings.sendgrid.replyToEmail ||
      settings.replyToEmail
  };
}

async function sendWithSendGrid(
  settings: EmailNotificationSettings,
  message: ProviderEmail
) {
  const apiKey = await getProviderSecret('sendgrid');
  if (!apiKey) {
    throw new Error('La clé API SendGrid est manquante.');
  }

  const sender = resolveSender(settings, message);
  if (!sender.email) {
    throw new Error("L'email expéditeur SendGrid est manquant.");
  }

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to: message.to,
    from: sender.name
      ? {
          email: sender.email,
          name: sender.name
        }
      : sender.email,
    replyTo: sender.replyTo || undefined,
    subject: message.subject,
    html: message.html,
    text: message.text || undefined,
    customArgs: message.metadata
      ? Object.fromEntries(
          Object.entries(message.metadata).map(([key, value]) => [
            key,
            String(value)
          ])
        )
      : undefined
  });
}

async function sendWithSmtp(
  settings: EmailNotificationSettings,
  message: ProviderEmail
) {
  const password = await getProviderSecret('smtp');
  const { host, port, secure, username } = settings.smtp;
  const sender = resolveSender(settings, message);

  if (!host) {
    throw new Error("L'hôte SMTP est manquant.");
  }
  if (!sender.email) {
    throw new Error("L'email expéditeur SMTP est manquant.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: username
      ? {
          user: username,
          pass: password || ''
        }
      : undefined
  });

  await transporter.sendMail({
    to: message.to,
    from: formatAddress(sender.email, sender.name),
    replyTo: sender.replyTo || undefined,
    subject: message.subject,
    html: message.html,
    text: message.text || undefined
  });
}

export async function sendWithProvider(
  provider: EmailProviderCode,
  settings: EmailNotificationSettings,
  message: ProviderEmail
) {
  if (provider === 'smtp') {
    await sendWithSmtp(settings, message);
    return;
  }
  await sendWithSendGrid(settings, message);
}
