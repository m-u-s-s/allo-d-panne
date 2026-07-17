import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getContent } from '@/content';
import { company } from '@/content/company';
import { SiteHeader } from './SiteHeader';

/**
 * Pas de NextIntlClientProvider : depuis finding 5, SiteHeader n'utilise
 * plus `Link` (@/i18n/navigation) — ses liens sont des `<a href>` calcules
 * server-side via `getPathname()`. LocaleSwitcher (qu'il rend) est lui
 * aussi un server component.
 */
function renderHeader(locale: 'fr' | 'nl' | 'en' = 'fr', path = '/') {
  return render(<SiteHeader locale={locale} path={path} />);
}

describe('SiteHeader', () => {
  it('nomme la region de navigation principale dans la langue de la page', () => {
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const c = getContent(locale);
      const { unmount } = renderHeader(locale);
      expect(
        screen.getByRole('navigation', { name: c.nav.primaryLabel }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('les liens de nav pointent vers la bonne locale', () => {
    renderHeader('nl', '/');
    expect(screen.getByRole('link', { name: 'Transport Europa' })).toHaveAttribute(
      'href',
      '/nl/transport-europe',
    );
    expect(screen.getByRole('link', { name: 'Tarieven' })).toHaveAttribute(
      'href',
      '/nl/tarifs',
    );
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/nl/contact',
    );
  });

  it('transmet le chemin courant au selecteur de langue', () => {
    // Le point central de finding 5 : sans `path` transmis correctement,
    // le selecteur de langue renverrait toujours vers l'accueil au lieu de
    // preserver la page courante.
    renderHeader('fr', '/tarifs');
    expect(screen.getByRole('link', { name: 'NL' })).toHaveAttribute(
      'href',
      '/nl/tarifs',
    );
  });

  it('le logo ramene a l accueil de la locale', () => {
    renderHeader('en', '/contact');
    const link = screen.getByRole('link', { name: company.displayName });
    expect(link).toHaveAttribute('href', '/en');
  });
});
