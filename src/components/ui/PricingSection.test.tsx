import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PricingSection } from './PricingSection';

describe('PricingSection', () => {
  /**
   * La base UX identifie "prix cache" comme un anti-pattern majeur du
   * secteur. Ces tests garantissent que les chiffres restent affiches.
   */
  it('affiche la fourchette bruxelloise', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/50/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('affiche le tarif kilometrique hors Bruxelles', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/2\s*€/)).toBeInTheDocument();
  });

  it('mentionne la possibilite de devis', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/devis/i)).toBeInTheDocument();
  });

  it('affiche les tarifs dans toutes les langues', () => {
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const { unmount } = render(<PricingSection locale={locale} />);
      expect(screen.getByText(/50/)).toBeInTheDocument();
      unmount();
    }
  });
});
