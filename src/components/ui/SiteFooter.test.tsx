import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { getContent } from '@/content';
import { SiteFooter } from './SiteFooter';

/**
 * Ces tests verrouillent le rendu, pas seulement la donnee.
 *
 * company.ts marque le numero de TVA fourni par le client
 * (BE06922715996 — 11 chiffres apres BE, le format belge en exige 10) et
 * son adresse (« Schaarbeeklei », une rue sans numero ni commune) comme
 * `todo`. company.test.ts prouve que ces champs sont `todo`. Mais rien ne
 * garantissait jusqu'ici que le composant respecte cette garde a l'usage :
 * un simple `isResolved` mal copie-colle, ou une future modification du
 * footer, pourrait faire fuiter ces valeurs dans la page sans qu'aucun
 * test ne le remarque. Pour une entreprise belge, publier une TVA ou une
 * adresse inventee n'est pas un detail cosmetique : c'est une mention
 * legale fausse, avec un vrai risque juridique. Ce fichier verifie donc le
 * DOM rendu — la sortie que verrait un client — pas seulement la structure
 * de donnees en amont.
 */
function renderFooter(locale: 'fr' | 'nl' | 'en' = 'fr') {
  return render(
    <NextIntlClientProvider locale={locale}>
      <SiteFooter locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('SiteFooter — le todo ne s affiche jamais', () => {
  it('n affiche pas le numero de TVA fourni par le client (invalide)', () => {
    renderFooter();
    expect(document.body.textContent).not.toContain('BE06922715996');
  });

  it('n affiche pas l adresse fournie par le client (incomplete)', () => {
    renderFooter();
    expect(document.body.textContent).not.toContain('Schaarbeeklei');
  });

  it('n affiche aucun libelle TVA tant que la donnee n est pas confirmee', () => {
    renderFooter();
    expect(document.body.textContent).not.toMatch(/TVA/);
  });

  it('affiche le telephone comme lien tel: fonctionnel', () => {
    renderFooter();
    const link = screen.getByRole('link', { name: /0467 78 64 56/ });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('affiche l email de contact, confirme donc autorise a s afficher', () => {
    renderFooter();
    const link = screen.getByRole('link', { name: /contact@alo-depannage\.com/ });
    expect(link).toHaveAttribute('href', 'mailto:contact@alo-depannage.com');
  });
});

describe('SiteFooter — repli de navigation mobile', () => {
  // Le header masque sa nav principale en dessous de md: (hidden md:flex),
  // donc sur mobile seul le footer peut porter ces liens. Sans eux, un
  // prospect transport ou assurance qui navigue au telephone arrive dans
  // une impasse : aucun moyen d'atteindre Transport Europe, Tarifs ou
  // Contact.
  it('propose un lien vers Transport Europe', () => {
    const c = getContent('fr');
    renderFooter();
    const nav = screen.getByRole('navigation', { name: c.footer.navLabel });
    const link = screen.getByRole('link', { name: 'Transport Europe' });
    expect(nav).toContainElement(link);
    expect(link).toHaveAttribute('href', '/fr/transport-europe');
  });

  it('propose un lien vers les Tarifs', () => {
    const c = getContent('fr');
    renderFooter();
    const nav = screen.getByRole('navigation', { name: c.footer.navLabel });
    const link = screen.getByRole('link', { name: 'Tarifs' });
    expect(nav).toContainElement(link);
    expect(link).toHaveAttribute('href', '/fr/tarifs');
  });

  it('propose un lien vers Contact', () => {
    const c = getContent('fr');
    renderFooter();
    const nav = screen.getByRole('navigation', { name: c.footer.navLabel });
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(nav).toContainElement(link);
    expect(link).toHaveAttribute('href', '/fr/contact');
  });

  it('a un aria-label distinct de la nav legale', () => {
    const c = getContent('fr');
    renderFooter();
    expect(
      screen.getByRole('navigation', { name: c.footer.navLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: c.footer.legalNavLabel }),
    ).toBeInTheDocument();
  });

  it('traduit le nom accessible des regions de navigation par langue (WCAG 3.1.2)', () => {
    // Avant ce fix, aria-label="Navigation" / "Légal" etaient figes en
    // francais dans le JSX, rendus tels quels sur /nl et /en. axe ne peut
    // pas detecter ce defaut : il valide l'attribut lang, jamais que le
    // contenu accessible correspond effectivement a cette langue. On
    // verrouille donc ici que le nom accessible change reellement par
    // locale, et qu'il ne reste jamais sur les valeurs francaises.
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const c = getContent(locale);
      const { unmount } = renderFooter(locale);
      expect(
        screen.getByRole('navigation', { name: c.footer.navLabel }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: c.footer.legalNavLabel }),
      ).toBeInTheDocument();
      unmount();
    }
    // "Navigation" est un mot correct en francais comme en anglais : sa
    // coincidence entre fr et en n'est pas un defaut. Le neerlandais, en
    // revanche, n'a aucune raison de coincider — s'il coincide, c'est que
    // le libelle n'est pas vraiment tire du contenu localise.
    const fr = getContent('fr');
    const nl = getContent('nl');
    const en = getContent('en');
    expect(nl.footer.navLabel).not.toBe(fr.footer.navLabel);
    expect(nl.footer.legalNavLabel).not.toBe(fr.footer.legalNavLabel);
    expect(en.footer.legalNavLabel).not.toBe(fr.footer.legalNavLabel);
  });
});
