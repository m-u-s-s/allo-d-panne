import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { Hero } from './Hero';

/**
 * next/image est un module CJS compile par SWC (helper `_export()`) que
 * l'interop CJS->ESM de Vite/Vitest ne sait pas analyser statiquement :
 * l'export par defaut arrive double-enveloppe et React refuse l'element
 * ("Element type is invalid ... got: object"). C'est un probleme d'outillage
 * de test, pas un bug de Hero ni de next/image en conditions reelles (Next
 * ne passe jamais par ce chemin d'interop). On isole donc le composant sous
 * test avec un stub fidele : il transmet toutes les props, y compris
 * `fetchPriority`, exactement comme le ferait le vrai composant.
 */
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fetchPriority,
  }: {
    src: string;
    alt: string;
    fetchPriority?: 'high' | 'low' | 'auto';
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- stub de test, pas le composant reel
    <img src={src} alt={alt} fetchPriority={fetchPriority} />
  ),
}));

/**
 * Link (@/i18n/navigation) lit la locale via useLocale() sous Vitest — le
 * bundler ne resout pas la condition "react-server" en dehors du build
 * Next, donc c'est toujours la variante client qui s'execute ici et elle
 * exige un NextIntlClientProvider (meme convention que SiteFooter.test.tsx).
 */
function renderHero(locale: 'fr' | 'nl' | 'en' = 'fr') {
  return render(
    <NextIntlClientProvider locale={locale}>
      <Hero locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('Hero', () => {
  it('porte un seul h1', () => {
    const { container } = renderHero();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('expose le lien d appel sans scroll', () => {
    renderHero();
    const link = screen.getByRole('link', { name: /appeler maintenant/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('annonce la disponibilite 24/7', () => {
    renderHero();
    expect(screen.getByText(/24h\/24/i)).toBeInTheDocument();
  });

  it('le poster porte un alt descriptif', () => {
    renderHero();
    const img = screen.getByAltText(/gyrophare/i);
    expect(img).toBeInTheDocument();
  });

  it('le poster est prioritaire — c est le LCP', () => {
    // Pilier de l'architecture : le LCP ne depend jamais du WebGL.
    // Au Plan 2 le canvas se pose PAR-DESSUS ce poster, sans le
    // remplacer dans le chemin de rendu initial.
    renderHero();
    const img = screen.getByAltText(/gyrophare/i);
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('n importe aucun module WebGL', async () => {
    // Garde-fou : si un jour Hero importe three, le palier Static casse.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('src/components/ui/Hero.tsx', 'utf8'),
    );
    expect(src).not.toMatch(/from ['"]three/);
    expect(src).not.toMatch(/@react-three/);
  });
});
