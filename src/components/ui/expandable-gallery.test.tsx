import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// next/image ne se monte pas hors du runtime Next (son export par defaut
// arrive ici comme un objet). Le composant sous test n'est pas next/image :
// une balise <img> qui recoit les memes props suffit, et `alt` — ce que ce
// fichier verifie — passe a l'identique.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    void rest;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  },
}));

const { ExpandableGallery } = await import('./expandable-gallery');

// framer-motion (useReducedMotion, en interne) interroge window.matchMedia,
// absent de jsdom.
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

describe('ExpandableGallery', () => {
  it('rend sa copie dans la langue de la page', () => {
    // La copie et les alt etaient ecrits en francais EN DUR : /nl et /en
    // affichaient un titre, un bouton et des alternatives textuelles
    // francaises. Ce test echouerait si l'on y revenait.
    const { unmount } = render(<ExpandableGallery locale="nl" />);
    expect(screen.getByText(/Niemand herinnert zich de pech/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Bekijk onze interventies/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/On ne se souvient pas/i)).not.toBeInTheDocument();
    unmount();

    render(<ExpandableGallery locale="en" />);
    expect(screen.getByText(/Nobody remembers the breakdown/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /See our call-outs/i }),
    ).toBeInTheDocument();
  });

  it('donne a chaque photo une alternative textuelle dans la bonne langue', () => {
    // Temoin positif : les alt sont la seule description des photos pour un
    // lecteur d'ecran. Trois cartes seulement sont montees au repos (la pile).
    const { unmount } = render(<ExpandableGallery locale="fr" />);
    const altsFr = screen.getAllByRole('img').map((i) => i.getAttribute('alt'));
    expect(altsFr).toHaveLength(3);
    for (const alt of altsFr) {
      expect(alt).toBeTruthy();
      // Les accents ont ete perdus a la premiere integration : « chargee »,
      // « ferme », « sanglee ». Aucun mot francais accentuable ne doit
      // reapparaitre sans son accent.
      expect(alt).not.toMatch(/\b(chargee|ferme|sanglee|operateurs)\b/);
    }
    expect(altsFr.join(' ')).toMatch(/chargée|opérateurs|sanglée/);
    unmount();

    render(<ExpandableGallery locale="nl" />);
    const altsNl = screen.getAllByRole('img').map((i) => i.getAttribute('alt'));
    expect(altsNl.join(' ')).toMatch(/supercar|takelwagen|laadbak/i);
    expect(altsNl.join(' ')).not.toMatch(/chargée|plateau/i);
  });
});
