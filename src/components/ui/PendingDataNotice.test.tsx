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

  it('liste chaque libelle de donnee manquante', () => {
    render(
      <PendingDataNotice title="En attente" body="Incomplet." fields={['TVA']} />,
    );
    expect(screen.getByText('TVA')).toBeInTheDocument();
  });

  it('n accepte pas de raison interne a afficher — seuls des libelles', () => {
    // Regression : le composant acceptait autrefois `{ label, reason }` et
    // recitait la raison interne (donnees client non confirmees) au
    // public. `fields` est maintenant `readonly string[]` : il n'y a
    // structurellement plus de place pour une `reason` a fuiter.
    render(
      <PendingDataNotice
        title="En attente"
        body="Incomplet."
        fields={['Numéro de TVA', 'Adresse du siège']}
      />,
    );
    expect(screen.getByText('Numéro de TVA')).toBeInTheDocument();
    expect(screen.getByText('Adresse du siège')).toBeInTheDocument();
  });

  it('est une region complementaire nommee par son titre, pas une alerte live', () => {
    render(
      <PendingDataNotice title="En attente" body="Incomplet." fields={['TVA']} />,
    );
    expect(
      screen.getByRole('complementary', { name: 'En attente' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
