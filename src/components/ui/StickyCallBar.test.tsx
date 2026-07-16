import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCallBar } from './StickyCallBar';

describe('StickyCallBar', () => {
  it('contient un lien d appel fonctionnel', () => {
    render(<StickyCallBar locale="fr" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('est fixee au bas de l ecran', () => {
    const { container } = render(<StickyCallBar locale="fr" />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('bottom-0');
  });

  it('est masquee sur desktop, ou le header porte deja le CTA', () => {
    const { container } = render(<StickyCallBar locale="fr" />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('md:hidden');
  });

  it('s affiche dans la langue demandee', () => {
    render(<StickyCallBar locale="nl" />);
    expect(screen.getByRole('link', { name: /bel nu/i })).toBeInTheDocument();
  });
});
