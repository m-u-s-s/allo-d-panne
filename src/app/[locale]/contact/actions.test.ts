import { beforeEach, describe, expect, it, vi } from 'vitest';

type TransportOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
};

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn();
  // Le parametre est type (pour que mock.calls[0][0] ne soit pas un
  // tuple vide plus bas) mais volontairement ignore ici : seul le mock
  // renvoye compte, les tests inspectent les appels via createTransport.mock.
  const createTransport = vi.fn((options: TransportOptions) => {
    void options;
    return { sendMail };
  });
  return { sendMail, createTransport };
});
vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

import { submitQuote } from './actions';

const valid = () => {
  const fd = new FormData();
  fd.set('name', 'Jean Dupont');
  fd.set('phone', '0470 12 34 56');
  fd.set('service', 'towing');
  return fd;
};

const withSmtpEnv = () => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('SMTP_PORT', '587');
  vi.stubEnv('SMTP_USER', 'contact@alb-depannage.com');
  vi.stubEnv('SMTP_PASS', 'secret');
};

describe('submitQuote', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    sendMail.mockReset();
    createTransport.mockClear();
  });

  it('renvoie une erreur de champ sans tenter d envoyer', async () => {
    withSmtpEnv();
    const fd = valid();
    fd.set('name', 'J');
    const r = await submitQuote({ status: 'idle' }, fd);
    expect(r.status).toBe('error');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('envoie et renvoie success quand SMTP repond', async () => {
    withSmtpEnv();
    sendMail.mockResolvedValue({ messageId: '1' });
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('success');
    expect(sendMail).toHaveBeenCalledOnce();
  });

  /**
   * Le coeur du sujet : SMTP en serverless echoue reellement. Si l'envoi
   * rate, l'utilisateur DOIT etre renvoye vers le telephone, jamais voir
   * un faux succes — sinon il attend un rappel qui ne viendra pas.
   */
  it('renvoie error si SMTP echoue', async () => {
    withSmtpEnv();
    sendMail.mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('error');
  });

  it('renvoie error si les identifiants SMTP sont absents', async () => {
    // Pas de withSmtpEnv() : simule un deploiement mal configure.
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('error');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('n affiche jamais success quand sendMail n a pas ete appele', async () => {
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).not.toBe('success');
  });

  it('renvoie error quand SMTP_PORT n est pas numerique', async () => {
    // Un port malforme doit echouer proprement, pas degrader
    // silencieusement `secure` a false.
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('SMTP_PORT', 'abc');
    vi.stubEnv('SMTP_USER', 'contact@alb-depannage.com');
    vi.stubEnv('SMTP_PASS', 'secret');
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('error');
    expect(sendMail).not.toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  /**
   * Verrouille deux choses qui ne doivent pas regresser silencieusement :
   * les timeouts SMTP (serverless peut pendre indefiniment sans eux), et
   * l'absence de cle `html` (le corps reste text/plain, ce qui elimine la
   * question de l'echappement — voir quote.test.ts).
   */
  it('configure les timeouts a 8000ms et n envoie que du texte', async () => {
    withSmtpEnv();
    sendMail.mockResolvedValue({ messageId: '1' });
    await submitQuote({ status: 'idle' }, valid());

    expect(createTransport).toHaveBeenCalledOnce();
    const transportOptions = createTransport.mock.calls[0][0];
    expect(transportOptions.connectionTimeout).toBe(8000);
    expect(transportOptions.greetingTimeout).toBe(8000);
    expect(transportOptions.socketTimeout).toBe(8000);

    expect(sendMail).toHaveBeenCalledOnce();
    const mailOptions = sendMail.mock.calls[0][0];
    expect(mailOptions).toHaveProperty('text');
    expect(mailOptions).not.toHaveProperty('html');
  });
});
