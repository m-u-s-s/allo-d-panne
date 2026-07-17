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
  // .trim() avant tout : Number(' ') vaut 0 (pas NaN — ToNumber sur une
  // chaine ne contenant que des espaces la traite comme vide, donc 0),
  // donc un SMTP_PORT blanc passerait le garde-fou ci-dessous tel quel et
  // produirait `port: 0`, `secure: false` en silence. Trimmer d'abord fait
  // qu'une chaine blanche redevient '', rejetee par le `!port` juste en
  // dessous — le meme chemin qu'une variable absente.
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  const parsedPort = Number(port);
  // Un SMTP_PORT malforme (non numerique) ne doit pas degrader
  // silencieusement `secure: config.port === 465` a false : un deploiement
  // mal configure doit echouer de la meme facon, testee, qu'un deploiement
  // sans configuration du tout.
  if (!Number.isFinite(parsedPort)) return null;

  return { host, port: parsedPort, user, pass };
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

  try {
    // createTransport() est dans le try : une erreur synchrone (config
    // rejetee par nodemailer, par exemple) doit renvoyer 'error' comme
    // toute autre panne SMTP, pas faire planter l'action.
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });

    await transport.sendMail({
      from: config.user,
      to: config.user,
      // parseQuote rejette tout \r\n sur email (Reply-To) et name
      // (Subject) : ces deux champs ne peuvent pas injecter d'en-tete
      // arbitraire. `service` atteint lui aussi le Subject (juste en
      // dessous), mais SERVICE_IDS le restreint a une liste blanche :
      // aucune valeur qu'il peut prendre ne contient de retour chariot,
      // donc pas besoin du meme controle. `location` et `message`
      // n'atteignent que le corps text/plain (voir renderQuoteEmail) et
      // n'ont besoin d'aucun controle d'injection d'en-tete.
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
