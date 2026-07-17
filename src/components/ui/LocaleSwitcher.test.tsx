import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getContent } from '@/content';
import { LocaleSwitcher } from './LocaleSwitcher';

/**
 * Server component depuis finding 5 : plus de client JS, plus de
 * NextIntlClientProvider necessaire. Ces tests verrouillent ce que la
 * finding exige explicitement : de vraies ancres (fonctionnent JS
 * desactive), aria-current sur la langue active, cibles tactiles 44x44,
 * et le chemin courant preserve au changement de langue.
 */
describe('LocaleSwitcher', () => {
  it('rend trois vraies ancres, pas des boutons', () => {
    render(<LocaleSwitcher current="fr" path="/tarifs" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href');
    }
  });

  it('chaque lien pointe vers le meme chemin, prefixe par sa propre langue', () => {
    render(<LocaleSwitcher current="fr" path="/tarifs" />);
    expect(screen.getByRole('link', { name: 'FR' })).toHaveAttribute(
      'href',
      '/fr/tarifs',
    );
    expect(screen.getByRole('link', { name: 'NL' })).toHaveAttribute(
      'href',
      '/nl/tarifs',
    );
    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      '/en/tarifs',
    );
  });

  it('preserve la racine — path="/" ne devient pas "//"', () => {
    render(<LocaleSwitcher current="fr" path="/" />);
    expect(screen.getByRole('link', { name: 'NL' })).toHaveAttribute(
      'href',
      '/nl',
    );
  });

  it('marque uniquement la langue active avec aria-current="page"', () => {
    render(<LocaleSwitcher current="nl" path="/contact" />);
    expect(screen.getByRole('link', { name: 'NL' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'FR' }),
    ).not.toHaveAttribute('aria-current');
    expect(
      screen.getByRole('link', { name: 'EN' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('offre des cibles tactiles de 44x44 minimum', () => {
    render(<LocaleSwitcher current="fr" path="/" />);
    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toMatch(/min-h-\[44px\]/);
      expect(link.className).toMatch(/min-w-\[44px\]/);
    }
  });

  it('le nom accessible de la region est localise (WCAG 3.1.2)', () => {
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const c = getContent(locale);
      const { unmount } = render(
        <LocaleSwitcher current={locale} path="/" />,
      );
      expect(
        screen.getByRole('navigation', { name: c.localeSwitcher.label }),
      ).toBeInTheDocument();
      unmount();
    }
  });
});
