import React from 'react';
import userEvent from '@testing-library/user-event';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import * as authApi from 'src/api/auth';

// ----------------------------------------------------------------------
// Mocks: must happen before importing the component
// ----------------------------------------------------------------------

const mockRouterPush = vi.fn();
vi.mock('src/routes/hooks', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('src/components/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

// Mock MUI theme provider so components render without full theme setup
vi.mock('@mui/material/styles', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const real = await importOriginal<typeof import('@mui/material/styles')>();
  return { ...real };
});

import { SignInView } from 'src/sections/auth/sign-in-view';

// ----------------------------------------------------------------------

describe('SignInView', () => {
  beforeEach(() => {
    vi.spyOn(authApi, 'login');
    mockRouterPush.mockClear();
  });

  it('renders email and password fields', () => {
    render(<SignInView />);
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });

  it('renders the Sign in button', () => {
    render(<SignInView />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('updates email field on user input', async () => {
    render(<SignInView />);
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  it('updates password field on user input', async () => {
    render(<SignInView />);
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    await userEvent.type(passwordInput, 'mypassword');
    expect(passwordInput.value).toBe('mypassword');
  });

  it('calls login and redirects on successful sign in', async () => {
    (authApi.login as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      accessToken: 'acc',
      refreshToken: 'ref',
    });

    render(<SignInView />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin@test.com', 'pass123');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message when login fails', async () => {
    (authApi.login as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    render(<SignInView />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'bad@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');

    const form = screen.getByLabelText(/email address/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeDefined();
    });
  });

  it('disables submit button while loading', async () => {
    // Never resolve so we can check loading state
    (authApi.login as ReturnType<typeof vi.spyOn>).mockReturnValueOnce(
      new Promise(() => {})
    );

    render(<SignInView />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass');

    const form = screen.getByLabelText(/email address/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /signing in/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
