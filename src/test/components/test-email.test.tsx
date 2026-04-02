import React from 'react';
import { it, vi, expect, describe } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import * as adminApi from 'src/api/admin';

// ----------------------------------------------------------------------

vi.mock('src/api/admin');

import TestEmailCard from 'src/sections/admin/test-email';

// ----------------------------------------------------------------------

describe('TestEmailCard', () => {
  it('renders recipient email input', () => {
    render(<TestEmailCard />);
    expect(screen.getByLabelText(/recipient email/i)).toBeDefined();
  });

  it('renders Send test email button initially', () => {
    render(<TestEmailCard />);
    const btn = screen.getByRole('button', { name: /send test email/i });
    expect(btn).toBeDefined();
  });

  it('disables send button when email field is empty', () => {
    render(<TestEmailCard />);
    const btn = screen.getByRole('button', { name: /send test email/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables send button when a valid email is typed', async () => {
    render(<TestEmailCard />);
    await userEvent.type(screen.getByLabelText(/recipient email/i), 'test@example.com');
    const btn = screen.getByRole('button', { name: /send test email/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows success alert after sending', async () => {
    (adminApi.sendTestEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      to: 'user@test.com',
    });

    render(<TestEmailCard />);
    await userEvent.type(screen.getByLabelText(/recipient email/i), 'user@test.com');
    fireEvent.click(screen.getByRole('button', { name: /send test email/i }));

    await waitFor(() => {
      expect(screen.getByText(/sent to/i)).toBeDefined();
    });
  });

  it('shows error alert when API call fails', async () => {
    (adminApi.sendTestEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('SMTP error')
    );

    render(<TestEmailCard />);
    await userEvent.type(screen.getByLabelText(/recipient email/i), 'user@test.com');
    fireEvent.click(screen.getByRole('button', { name: /send test email/i }));

    await waitFor(() => {
      expect(screen.getByText(/smtp error/i)).toBeDefined();
    });
  });

  it('clears email and alerts when Clear button is clicked', async () => {
    render(<TestEmailCard />);
    const emailInput = screen.getByLabelText(/recipient email/i) as HTMLInputElement;
    await userEvent.type(emailInput, 'clear@test.com');

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(emailInput.value).toBe('');
  });
});
