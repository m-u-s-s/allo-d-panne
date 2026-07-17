import { describe, expect, it } from 'vitest';
import { company, isLegalComplete, isResolved, resolved, todo } from './company';

describe('Field', () => {
  it('isResolved discrimine un champ resolu', () => {
    const f = resolved('valeur');
    expect(isResolved(f)).toBe(true);
    if (isResolved(f)) expect(f.value).toBe('valeur');
  });

  it('isResolved rejette un champ todo', () => {
    expect(isResolved(todo('pas confirme'))).toBe(false);
  });

  it('un todo porte toujours une raison non vide', () => {
    const f = todo('la TVA a un chiffre en trop');
    expect(f.status).toBe('todo');
    if (!isResolved(f)) expect(f.reason.length).toBeGreaterThan(0);
  });
});

describe('Donnees entreprise confirmees', () => {
  it('le nom est resolu', () => {
    expect(isResolved(company.legalName)).toBe(true);
  });

  it('email et telephone sont resolus', () => {
    expect(isResolved(company.email)).toBe(true);
    expect(company.phoneE164).toBe('+32467786456');
  });

  it('la disponibilite 24/7 est confirmee', () => {
    expect(company.available247).toBe(true);
  });
});

describe('Donnees NON confirmees — protection contre l invention', () => {
  /**
   * Ces trois champs sont faux ou incomplets et attendent le client.
   * Ils DOIVENT rester todo. Si quelqu'un les "resout" avec une valeur
   * plausible pour faire passer un build, ces tests le rattrapent.
   * Mentions legales fausses en Belgique = risque juridique reel.
   */
  it('la TVA reste todo — BE06922715996 a 11 chiffres au lieu de 10', () => {
    expect(company.vat.status).toBe('todo');
  });

  it('l adresse reste todo — Schaarbeeklei sans numero ni commune', () => {
    expect(company.address.status).toBe('todo');
  });

  it('la zone autoroute reste todo — concession belge par zone', () => {
    expect(company.motorwayZone.status).toBe('todo');
  });

  it('chaque todo explique ce qui manque', () => {
    for (const field of [company.vat, company.address, company.motorwayZone]) {
      expect(field.status).toBe('todo');
      // Narrowing par discriminant, pas via isResolved() : sur un tableau
      // heterogene Field<string> | Field<Address>, le guard generique ne
      // reduit pas la branche negative et `.reason` n'existe alors pas.
      if (field.status === 'todo') {
        expect(field.reason.length).toBeGreaterThan(20);
      }
    }
  });
});

describe('Perimetre d intervention', () => {
  /**
   * La spec scinde la promesse "toute l'Europe" : elle n'est vraie que
   * pour le transport. Un camion ne traverse pas l'Europe pour une
   * batterie a plat.
   */
  it('l urgence est locale, pas europeenne', () => {
    expect(company.emergencyScope).toBe('brussels-region');
  });

  it('le transport est europeen', () => {
    expect(company.transportScope).toBe('europe');
  });
});

describe('isLegalComplete — source unique partagee (sitemap + page mentions legales)', () => {
  /**
   * Le sitemap et la page des mentions legales doivent s'accorder sur
   * "cette page est-elle publiable ?". Un seul predicat evite qu'ils
   * divergent silencieusement si un champ requis change d'un cote sans
   * l'autre.
   */
  it('est faux tant que la TVA ou l adresse restent todo', () => {
    expect(isResolved(company.vat)).toBe(false);
    expect(isResolved(company.address)).toBe(false);
    expect(isLegalComplete()).toBe(false);
  });

  it('correspond exactement a TVA resolue ET adresse resolue', () => {
    expect(isLegalComplete()).toBe(
      isResolved(company.vat) && isResolved(company.address),
    );
  });
});
