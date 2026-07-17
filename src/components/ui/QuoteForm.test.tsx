import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteForm } from './QuoteForm';

describe('QuoteForm', () => {
  it('chaque champ a un label associe', () => {
    // Regle a11y CRITICAL : label avec for. getByLabelText echoue si
    // l'association est absente.
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/votre téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/votre email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type d/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/où êtes-vous/i)).toBeInTheDocument();
  });

  it('le champ telephone utilise le bon type', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre téléphone/i)).toHaveAttribute('type', 'tel');
  });

  it('le champ email utilise le bon type', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre email/i)).toHaveAttribute('type', 'email');
  });

  it('les champs obligatoires sont marques', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre nom/i)).toBeRequired();
    expect(screen.getByLabelText(/votre téléphone/i)).toBeRequired();
  });

  it('propose tous les services', () => {
    render(<QuoteForm locale="fr" />);
    const select = screen.getByLabelText(/type d/i);
    expect(select.querySelectorAll('option').length).toBeGreaterThanOrEqual(8);
  });

  it('le bouton de soumission respecte la cible tactile', () => {
    render(<QuoteForm locale="fr" />);
    const button = screen.getByRole('button', { name: /envoyer/i });
    expect(button.className).toMatch(/min-h-\[44px\]/);
  });
});
