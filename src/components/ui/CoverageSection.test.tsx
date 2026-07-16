import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverageSection } from './CoverageSection';

describe('CoverageSection', () => {
  it('distingue l urgence locale du transport europeen', () => {
    render(<CoverageSection locale="fr" />);
    expect(screen.getByText(/Urgence — Bruxelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Transport — toute l'Europe/i)).toBeInTheDocument();
  });

  it('ne promet jamais une urgence europeenne', () => {
    // La promesse intenable qu'on refuse de faire.
    const { container } = render(<CoverageSection locale="fr" />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/urgence.{0,30}toute l'Europe/i);
  });
});
