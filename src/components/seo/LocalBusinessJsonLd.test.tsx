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
    expect(data['@type']).toBe('AutoRepair');
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

  it('declare la zone desservie pour l urgence, pas toute l Europe', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(JSON.stringify(data.areaServed)).toMatch(/Brussels/i);
  });
});
