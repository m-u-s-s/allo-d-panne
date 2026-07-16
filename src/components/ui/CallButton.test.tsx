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
});
