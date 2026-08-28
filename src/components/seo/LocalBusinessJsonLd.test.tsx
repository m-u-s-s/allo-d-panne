import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocalBusinessJsonLd } from './LocalBusinessJsonLd';

function parse(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? '{}');
}

describe('LocalBusinessJsonLd', () => {
  it('declare un AutoRepair avec telephone', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data['@type']).toContain('AutoRepair');
    expect(data['@type']).toContain('EmergencyService');
    expect(data.telephone).toBe('+32467786456');
  });

  it('declare une ouverture 24/7', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.openingHoursSpecification.opens).toBe('00:00');
    expect(data.openingHoursSpecification.closes).toBe('23:59');
  });

  /**
   * Une TVA ou une adresse inventee dans un schema.org est pire qu'absente :
   * c'est structure, machine-lisible, et Google le croit.
   */
  it('n emet AUCUNE adresse tant qu elle est todo', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.address).toBeUndefined();
  });

  it('n emet AUCUN identifiant TVA tant qu il est todo', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.vatID).toBeUndefined();
    expect(data.taxID).toBeUndefined();
  });

  it('donne les autres graphies du nom, fautes comprises', () => {
    // Demande client : etre trouve meme quand le nom est mal ecrit. La
    // place correcte est alternateName — PAS le texte visible, qu'un
    // autre test garde propre.
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.alternateName).toContain('Alo Depannage');
    expect(data.alternateName).toContain('Allo Depanage');
    expect(data.alternateName.length).toBeGreaterThanOrEqual(8);
  });

  it('liste les communes bruxelloises, dans leurs deux graphies', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    const zones = JSON.stringify(data.areaServed);
    for (const commune of [
      'Schaerbeek',
      'Schaarbeek',
      'Ixelles',
      'Elsene',
      'Uccle',
      'Molenbeek-Saint-Jean',
    ]) {
      expect(zones).toContain(commune);
    }
  });

  it('publie le catalogue de services dans la langue de la page', () => {
    // Temoin positif : le catalogue doit CHANGER avec la langue, sinon
    // il est fige sur le francais sans que personne s'en apercoive.
    const fr = render(<LocalBusinessJsonLd locale="fr" />);
    const dataFr = parse(fr.container);
    expect(dataFr.hasOfferCatalog.itemListElement).toHaveLength(8);
    expect(JSON.stringify(dataFr.hasOfferCatalog)).toContain('Remorquage');
    fr.unmount();

    const nl = render(<LocalBusinessJsonLd locale="nl" />);
    const dataNl = parse(nl.container);
    expect(JSON.stringify(dataNl.hasOfferCatalog)).toContain('Takelen');
    expect(JSON.stringify(dataNl.hasOfferCatalog)).not.toContain('Remorquage');
  });

  it('declare la zone desservie pour l urgence, pas toute l Europe', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(JSON.stringify(data.areaServed)).toMatch(/Brussels/i);
  });

  /**
   * `description` vient de `c.meta.description` (texte libre), pas d'un
   * `Field<T>` : la garde `isResolved` qui protege address/vatID ne le
   * couvre pas. Avant ce fix, meta.description se terminait par "Agréé et
   * assuré" — la meme pretention que company.motorwayZone.reason dit non
   * publiable telle quelle (l'agrement autoroutier belge est concede par
   * zone). Cette phrase atterrissait donc, verbatim, dans le meme objet
   * JSON structure que l'adresse et la TVA qu'on refuse d'y inventer.
   */
  it('ne publie pas la pretention agrement/assurance non qualifiee dans le schema.org', () => {
    const banned = /agréé et assuré|erkend en verzekerd|approved and insured/i;
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const { container, unmount } = render(<LocalBusinessJsonLd locale={locale} />);
      const data = parse(container);
      expect(typeof data.description).toBe('string');
      expect(data.description).not.toMatch(banned);
      unmount();
    }
  });
});
