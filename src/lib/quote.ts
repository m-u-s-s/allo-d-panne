import { SERVICE_IDS, type ServiceId } from '@/content';

export type Quote = {
  name: string;
  phone: string;
  email: string | null;
  service: ServiceId;
  location: string;
  message: string;
};

export type ParseResult =
  | { ok: true; data: Quote }
  | { ok: false; field: 'name' | 'phone' | 'email' | 'service' };

/** Rejette tout ce qui pourrait injecter un en-tete SMTP. */
const hasHeaderInjection = (value: string) => /[\r\n]/.test(value);

export function parseQuote(formData: FormData): ParseResult {
  const get = (key: string) => String(formData.get(key) ?? '').trim();

  const name = get('name');
  if (name.length < 2) return { ok: false, field: 'name' };
  // name devient le Subject de l'e-mail : meme regle que pour email et
  // Reply-To. Rejeter, pas nettoyer.
  if (hasHeaderInjection(name)) return { ok: false, field: 'name' };

  const phone = get('phone');
  if (phone.replace(/[\s.\-()+]/g, '').length < 6) {
    return { ok: false, field: 'phone' };
  }

  const rawEmail = get('email');
  let email: string | null = null;
  if (rawEmail.length > 0) {
    // Rejeter, pas nettoyer : une adresse avec un retour chariot n'est
    // pas une adresse mal formatee, c'est une tentative d'injection.
    if (hasHeaderInjection(rawEmail)) return { ok: false, field: 'email' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return { ok: false, field: 'email' };
    }
    email = rawEmail;
  }

  const service = get('service');
  if (!SERVICE_IDS.includes(service as ServiceId)) {
    return { ok: false, field: 'service' };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      service: service as ServiceId,
      location: get('location'),
      message: get('message'),
    },
  };
}

/**
 * Corps en texte brut. Aucun HTML n'est genere, ce qui supprime la
 * question de l'echappement : le contenu utilisateur ne peut pas
 * devenir du balisage.
 */
export function renderQuoteEmail(q: Quote): string {
  return [
    'Nouvelle demande de devis — allo-depannage.com',
    '',
    `Nom        : ${q.name}`,
    `Telephone  : ${q.phone}`,
    `Email      : ${q.email ?? '(non fourni)'}`,
    `Service    : ${q.service}`,
    `Localisation : ${q.location || '(non fournie)'}`,
    '',
    'Message :',
    q.message || '(aucun)',
  ].join('\n');
}
