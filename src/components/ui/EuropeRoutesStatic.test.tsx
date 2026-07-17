import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CITIES, EuropeRoutesStatic } from './EuropeRoutesStatic';

describe('EuropeRoutesStatic', () => {
  it('expose un role image avec un label accessible', () => {
    render(
      <EuropeRoutesStatic alt="Carte des trajets" fromLabel="Depuis" toLabel="vers" />,
    );
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
    render(<EuropeRoutesStatic alt="Carte" fromLabel="Depuis" toLabel="vers" />);
    // Liste importee du composant (CITIES exporte), pas dupliquee ici : une
    // ville ajoutee/retiree dans EuropeRoutesStatic.tsx ne peut plus faire
    // diverger silencieusement ce test de la realite du composant.
    for (const city of CITIES.map((c) => c.name)) {
      expect(
        screen.getByText(new RegExp(city, 'i'), { selector: 'figcaption' })
      ).toBeInTheDocument();
    }
  });

  it('localise le texte connectif du figcaption — pas de francais fige sur /en', () => {
    // Le figcaption est l'unique alternative textuelle du composant : s'il
    // reste "Trajets au depart de" en dur, /en/transport-europe rend un
    // figcaption moitie anglais moitie francais (WCAG 3.1.2). fromLabel et
    // toLabel viennent de SiteContent (transportPage.routesCaptionFrom/To) ;
    // ce test verifie qu'ils s'affichent verbatim, pas les connecteurs
    // francais historiques.
    render(
      <EuropeRoutesStatic alt="Map" fromLabel="Trips from" toLabel="to" />,
    );
    const figcaption = screen.getByText(/trips from/i, { selector: 'figcaption' });
    expect(figcaption).toHaveTextContent(/Trips from .* to /);
    expect(figcaption).not.toHaveTextContent(/Trajets au départ de/);
  });
});
