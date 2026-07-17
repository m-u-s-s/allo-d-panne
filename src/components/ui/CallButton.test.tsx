import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallButton } from './CallButton';

describe('CallButton', () => {
  it('pointe vers le numero au format international', () => {
    render(<CallButton label="Appeler maintenant" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler maintenant/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('affiche le libelle fourni', () => {
    render(<CallButton label="Bel nu" variant="primary" />);
    expect(screen.getByRole('link', { name: /bel nu/i })).toBeInTheDocument();
  });

  it('respecte la cible tactile minimale de 44px', () => {
    render(<CallButton label="Appeler" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link.className).toMatch(/min-h-\[44px\]/);
  });

  it('utilise le texte sombre sur le CTA ambre, jamais blanc', () => {
    // Blanc sur #F97316 = 2,68:1, echec WCAG AA. Verrouille par
    // src/lib/tokens.test.ts ; ici on verifie que le composant applique
    // bien le token et ne le contourne pas.
    render(<CallButton label="Appeler" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link.className).toContain('text-cta-fg');
    expect(link.className).not.toContain('text-white');
  });

  describe('variant header', () => {
    // Le CTA du header : icone seule sous md, icone + libelle des md, mais
    // c'est TOUJOURS le meme <a> — jamais display:none. Voir le
    // commentaire dans CallButton.tsx : une paire de liens bascules par
    // hidden/md:hidden serait invisible a l'un des deux breakpoints, et
    // casserait "numero atteignable sans scroll" sur celui-la (le premier
    // a[href="tel:..."] du DOM est celui teste par e2e/conversion.spec.ts,
    // sans connaitre le viewport).
    it('expose le libelle comme nom accessible meme quand il est visuellement masque sous md', () => {
      render(<CallButton label="Appeler maintenant" variant="header" />);
      const link = screen.getByRole('link', { name: /appeler maintenant/i });
      expect(link).toHaveAttribute('href', 'tel:+32467786456');
      expect(link).toHaveAttribute('aria-label', 'Appeler maintenant');
    });

    it('ne masque jamais l element lui-meme, seul le libelle se replie sous md', () => {
      render(<CallButton label="Appeler" variant="header" />);
      const link = screen.getByRole('link', { name: /appeler/i });
      expect(link.className).not.toMatch(/(^|\s)hidden(\s|$)/);
      expect(link.className).not.toContain('md:hidden');
    });

    it('respecte la cible tactile minimale de 44px', () => {
      render(<CallButton label="Appeler" variant="header" />);
      const link = screen.getByRole('link', { name: /appeler/i });
      expect(link.className).toMatch(/min-h-\[44px\]/);
      expect(link.className).toMatch(/min-w-\[44px\]/);
    });
  });
});
