import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { CITIES, EuropeRadar } from './EuropeRadar';

// framer-motion (useReducedMotion) interroge window.matchMedia, que jsdom
// n'implemente pas. Le stub repond "pas de preference" : les tests mesurent
// donc le chemin ANIME, celui que voit la majorite des visiteurs.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

describe('EuropeRadar', () => {
  it('expose un role image avec un label accessible', () => {
    render(
      <EuropeRadar alt="Carte des trajets" fromLabel="Depuis" toLabel="vers" />,
    );
    expect(
      screen.getByRole('img', { name: /carte des trajets/i }),
    ).toBeInTheDocument();
  });

  it('liste les villes en texte, pas seulement en graphique', () => {
    // Contrat repris de l'ancienne carte : le graphique n'est jamais le seul
    // porteur d'information. Le bloc visuel entier etant un role="img", ses
    // enfants sont opaques aux technologies d'assistance — le figcaption
    // sr-only est donc L'UNIQUE alternative textuelle. L'assertion porte
    // specifiquement sur lui (via selector) : un test qui passerait encore
    // apres suppression du figcaption ne vaudrait rien.
    render(<EuropeRadar alt="Carte" fromLabel="Depuis" toLabel="vers" />);
    // Liste importee du composant (CITIES exporte), pas dupliquee ici : une
    // ville ajoutee/retiree dans EuropeRadar.tsx ne peut plus faire diverger
    // silencieusement ce test de la realite du composant.
    for (const city of CITIES.map((c) => c.name)) {
      expect(
        screen.getByText(new RegExp(city, 'i'), { selector: 'figcaption' }),
      ).toBeInTheDocument();
    }
  });

  it('affiche AUSSI chaque destination en tuile visible', () => {
    // Temoin positif du test precedent : sans lui, vider les rangees de
    // villes laisserait le figcaption intact et la suite verte, alors que
    // l'ecran ne montrerait plus qu'un scope vide. Correspondance EXACTE :
    // le figcaption, lui, est une longue phrase qui contient les memes noms
    // — seule la tuile correspond mot pour mot.
    render(<EuropeRadar alt="Carte" fromLabel="Depuis" toLabel="vers" />);
    for (const city of CITIES.slice(1).map((c) => c.name)) {
      expect(screen.getByText(city)).toBeInTheDocument();
    }
    // Le hub porte sa propre pastille au centre du scope.
    expect(screen.getByText(CITIES[0].name)).toBeInTheDocument();
  });

  it('localise le texte connectif du figcaption — pas de francais fige sur /en', () => {
    // Le figcaption est l'unique alternative textuelle du composant : s'il
    // reste "Trajets au depart de" en dur, /en/transport-europe rend un
    // figcaption moitie anglais moitie francais (WCAG 3.1.2). fromLabel et
    // toLabel viennent de SiteContent (transportPage.routesCaptionFrom/To) ;
    // ce test verifie qu'ils s'affichent verbatim, pas les connecteurs
    // francais historiques.
    render(<EuropeRadar alt="Map" fromLabel="Trips from" toLabel="to" />);
    const figcaption = screen.getByText(/trips from/i, {
      selector: 'figcaption',
    });
    expect(figcaption).toHaveTextContent(/Trips from .* to /);
    expect(figcaption).not.toHaveTextContent(/Trajets au départ de/);
  });
});
