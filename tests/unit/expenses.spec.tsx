import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpensesPage from '@/app/(app)/expenses/page';

// Mock the server/action proxies used by the component
vi.mock('@/server/actions/proxies', () => ({
  getEnvelopeBalancesS: async () => [
    { envelopeId: 'e1', name: 'Caisse', balance: 100, protected: false, active: true },
    { envelopeId: 'e2', name: 'Réserve', balance: 50, protected: true, active: true },
  ],
  createExpenseS: async () => ({ ok: true }),
  // stub server form action used by the server-wrapper form
  // In tests, provide a string action (URL) instead of a function so jsdom/React
  // doesn't warn about non-string 'action' prop on <form> when rendering.
  createExpenseFormS: '/',
}));

describe('ExpensesPage', () => {
  it('renders and shows envelope balance and warns on overrun', async () => {
    render(<ExpensesPage />);

    // Wait for envs to be loaded and select to be present
    const select = await screen.findByLabelText(/Enveloppe/i);
    expect(select).toBeInTheDocument();

    // Choose envelope with small balance
    fireEvent.change(select, { target: { value: 'e2' } });

    // Amount input
    const amount = screen.getByLabelText(/Montant/i);
    fireEvent.change(amount, { target: { value: '100' } });

  // The balance display and warnings should appear
  await waitFor(() => expect(screen.getByText(/Solde disponible/)).toBeInTheDocument());

  // Since amount > balance and envelope is protected, we should see warnings
  // Target a specific protected-envelope warning to avoid ambiguous matches
  expect(screen.getByText(/Enveloppe 'Réserve' protégée/)).toBeInTheDocument();
  // Match the detailed list item (e.g. "Dépassement (100 F CFA > solde 50 F CFA)")
  expect(screen.getByText(/Dépassement \(/)).toBeInTheDocument();

  // The submit button should be disabled because of blocking warnings
  const submit = screen.getByRole('button', { name: /Valider la dépense/i });
  expect(submit).toBeDisabled();
  });
});
