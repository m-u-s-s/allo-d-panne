import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PendingDataNotice } from './PendingDataNotice';

describe('PendingDataNotice', () => {
  it('ne rend rien si tout est confirme', () => {
    const { container } = render(
      <PendingDataNotice title="T" body="B" fields={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('liste chaque donnee manquante avec sa raison', () => {
    render(
      <PendingDataNotice
        title="En attente"
        body="Incomplet."
        fields={[{ label: 'TVA', reason: 'Un chiffre en trop.' }]}
      />,
    );
    expect(screen.getByText(/TVA/)).toBeInTheDocument();
    expect(screen.getByText(/un chiffre en trop/i)).toBeInTheDocument();
  });

  it('utilise un role alert', () => {
    render(
      <PendingDataNotice
        title="En attente"
        body="Incomplet."
        fields={[{ label: 'TVA', reason: 'Manquant.' }]}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
