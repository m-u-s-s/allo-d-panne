import { describe, expect, it } from 'vitest';
import { parseQuote, renderQuoteEmail } from './quote';

const valid = () => {
  const fd = new FormData();
  fd.set('name', 'Jean Dupont');
  fd.set('phone', '0470 12 34 56');
  fd.set('email', 'jean@example.com');
  fd.set('service', 'towing');
  fd.set('location', 'Ring de Bruxelles, sortie 9');
  fd.set('message', 'Voiture immobilisee, roue avant droite.');
  return fd;
};

describe('parseQuote', () => {
  it('accepte une demande complete', () => {
    const r = parseQuote(valid());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe('Jean Dupont');
  });

  it('rejette un nom trop court', () => {
    const fd = valid();
    fd.set('name', 'J');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('name');
  });

  it('rejette un telephone trop court', () => {
    const fd = valid();
    fd.set('phone', '123');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('phone');
  });

  it('rejette un service inconnu', () => {
    const fd = valid();
    fd.set('service', 'teleportation');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('service');
  });

  it('accepte une demande sans email — le telephone suffit', () => {
    const fd = valid();
    fd.delete('email');
    expect(parseQuote(fd).ok).toBe(true);
  });

  /**
   * Injection d'en-tete SMTP : un \r\n dans un champ qui finit en
   * Reply-To permettrait d'ajouter des en-tetes arbitraires (Bcc vers
   * une liste de spam, par exemple). Le champ email doit etre rejete,
   * pas nettoye — une adresse contenant un retour chariot n'est pas une
   * adresse.
   */
  it('rejette un email contenant un retour chariot', () => {
    const fd = valid();
    fd.set('email', 'a@b.com\r\nBcc: victime@example.com');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('email');
  });

  it('rejette un email contenant un saut de ligne', () => {
    const fd = valid();
    fd.set('email', 'a@b.com\nBcc: victime@example.com');
    expect(parseQuote(fd).ok).toBe(false);
  });

  it('rejette un email sans arobase', () => {
    const fd = valid();
    fd.set('email', 'pas-une-adresse');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('email');
  });

  /**
   * name finit dans le Subject de l'e-mail (voir actions.ts). Meme
   * raisonnement que pour email/Reply-To : un retour chariot dans le nom
   * permettrait d'ajouter des en-tetes arbitraires (Bcc, etc.).
   */
  it('rejette un nom contenant un retour chariot', () => {
    const fd = valid();
    fd.set('name', 'Jean\r\nBcc: victime@example.com');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('name');
  });

  it('rejette un nom contenant un saut de ligne', () => {
    const fd = valid();
    fd.set('name', 'Jean\nBcc: victime@example.com');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('name');
  });
});

describe('renderQuoteEmail', () => {
  it('produit du texte brut contenant les champs', () => {
    const r = parseQuote(valid());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const body = renderQuoteEmail(r.data);
    expect(body).toContain('Jean Dupont');
    expect(body).toContain('0470 12 34 56');
    expect(body).toContain('Ring de Bruxelles');
  });

  /**
   * Le corps est en texte brut : pas de HTML, donc pas de question
   * d'echappement. Ce test verrouille ce choix — si quelqu'un passe
   * l'email en HTML sans echapper, il devra d'abord casser ce test.
   */
  it('n interpole jamais de HTML', () => {
    const fd = valid();
    fd.set('message', '<img src=x onerror=alert(1)>');
    const r = parseQuote(fd);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const body = renderQuoteEmail(r.data);
    // Le contenu arrive tel quel dans un corps text/plain : ni balise
    // interpretee, ni echappement HTML a maintenir.
    expect(body).toContain('<img src=x onerror=alert(1)>');
    expect(body).not.toContain('&lt;');
  });
});
