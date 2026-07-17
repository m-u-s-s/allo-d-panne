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
    // d'information (regle a11y). "Bruxelles" apparait a la fois comme
    // label SVG et dans le figcaption texte : on utilise getAllByText
    // (et non getByText) car les deux sont des correspondances legitimes.
    render(<EuropeRoutesStatic alt="Carte" />);
    expect(screen.getAllByText(/Bruxelles/i).length).toBeGreaterThan(0);
  });
});
