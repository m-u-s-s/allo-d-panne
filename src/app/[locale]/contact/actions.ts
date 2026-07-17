'use server';

import nodemailer from 'nodemailer';
import { parseQuote, renderQuoteEmail } from '@/lib/quote';

export type QuoteState = {
  status: 'idle' | 'success' | 'error';
  field?: string;
};

/** SMTP en serverless peut pendre : on coupe court plutot que faire attendre. */
const SMTP_TIMEOUT_MS = 8_000;

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;
  return { host, port: Number(port), user, pass };
}

/**
 * Envoie la demande de devis par SMTP sur la boite existante.
 *
 * Regle non negociable : on ne renvoie 'success' QUE si sendMail a
 * resolu. Un faux succes laisse le client attendre un rappel qui ne
 * viendra jamais — pour une entreprise de depannage, c'est un client
 * perdu et une reputation abimee. En cas d'echec, l'UI renvoie vers le
 * telephone.
 */
export async function submitQuote(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const parsed = parseQuote(formData);
  if (!parsed.ok) {
    return { status: 'error', field: parsed.field };
  }

  const config = readSmtpConfig();
  if (!config) {
    console.error('[quote] identifiants SMTP absents — envoi impossible');
    return { status: 'error', field: 'smtp' };
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  try {
    await transport.sendMail({
      from: config.user,
      to: config.user,
      // parseQuote a rejete tout \r\n : pas d'injection d'en-tete possible.
      replyTo: parsed.data.email ?? undefined,
      subject: `Devis — ${parsed.data.service} — ${parsed.data.name}`,
      text: renderQuoteEmail(parsed.data),
    });
    return { status: 'success' };
  } catch (error) {
    console.error('[quote] echec SMTP', error);
    return { status: 'error', field: 'smtp' };
  }
}
