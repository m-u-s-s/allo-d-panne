import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EuropeRoutesStatic } from './EuropeRoutesStatic';

describe('EuropeRoutesStatic', () => {
  it('expose un role image avec un label accessible', () => {
    render(<EuropeRoutesStatic alt="Carte des trajets" />);
    expect(screen.getByRole('img', { name: /carte des trajets/i })).toBeInTheDocument();
  });

  it('liste les villes en texte, pas seulement en graphique', () => {
    // La couleur et le graphique ne sont jamais les seuls porteurs
    // d'information (regle a11y) : le figcaption sr-only est le porteur du
    // texte accessible, le <text> du SVG n'est que decoratif. L'assertion
    // porte donc specifiquement sur le figcaption (via selector) et non sur
    // "n'importe quel element du DOM" — un test qui passerait encore apres
    // suppression du figcaption ne vaudrait rien, puisque le figcaption est
    // la raison d'etre de cette exigence.
    render(<EuropeRoutesStatic alt="Carte" />);
    const cities = [
      'Bruxelles',
      'Paris',
      'Amsterdam',
      'Cologne',
      'Milan',
      'Madrid',
      'Berlin',
      'Vienne',
    ];
    for (const city of cities) {
      expect(
        screen.getByText(new RegExp(city, 'i'), { selector: 'figcaption' })
      ).toBeInTheDocument();
    }
  });
});
