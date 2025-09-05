import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '~/components/auth/login-form';
import { RegisterForm } from '~/components/auth/register-form';
import { UserMenu } from '~/components/auth/user-menu';
import { AuthProvider } from '~/components/auth/auth-provider';
import { PasswordResetForm } from '~/components/auth/password-reset-form';
import { PasswordChangeForm } from '~/components/auth/password-change-form';

// Mock the auth client
jest.mock('~/lib/auth-client', () => ({
  signIn: {
    email: jest.fn(),
    social: jest.fn(),
  },
  signUp: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  useSession: jest.fn(),
  forgetPassword: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

const mockSignIn = require('~/lib/auth-client').signIn;
const mockSignUp = require('~/lib/auth-client').signUp;
const mockSignOut = require('~/lib/auth-client').signOut;
const mockUseSession = require('~/lib/auth-client').useSession;
const mockForgetPassword = require('~/lib/auth-client').forgetPassword;

/**
 * Component tests for authentication forms and UI
 */

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('should render login form with all fields', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });

    it('should handle email/password login', async () => {
      const user = userEvent.setup();
      mockSignIn.email.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn.email).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      mockSignIn.email.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should handle Google sign-in', async () => {
      const user = userEvent.setup();
      mockSignIn.social.mockResolvedValue({});

      render(<LoginForm />);

      const googleButton = screen.getByText(/google/i).closest('button');
      expect(googleButton).toBeInTheDocument();

      if (googleButton) {
        await user.click(googleButton);

        await waitFor(() => {
          expect(mockSignIn.social).toHaveBeenCalledWith({
            provider: 'google',
            callbackURL: '/',
          });
        });
      }
    });

    it('should handle GitHub sign-in', async () => {
      const user = userEvent.setup();
      mockSignIn.social.mockResolvedValue({});

      render(<LoginForm />);

      const githubButton = screen.getByText(/github/i).closest('button');
      expect(githubButton).toBeInTheDocument();

      if (githubButton) {
        await user.click(githubButton);

        await waitFor(() => {
          expect(mockSignIn.social).toHaveBeenCalledWith({
            provider: 'github',
            callbackURL: '/',
          });
        });
      }
    });
  });

  describe('RegisterForm', () => {
    it('should render registration form with all fields', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should handle successful registration', async () => {
      const user = userEvent.setup();
      mockSignUp.email.mockResolvedValue({ error: null });

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp.email).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe',
        });
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockSignUp.email).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });

      expect(mockSignUp.email).not.toHaveBeenCalled();
    });

    it('should show success message after registration', async () => {
      const user = userEvent.setup();
      mockSignUp.email.mockResolvedValue({ error: null });

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Registration successful!')).toBeInTheDocument();
        expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
      });
    });
  });

  describe('UserMenu', () => {
    it('should show sign in/up buttons when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });

      render(
        <AuthProvider>
          <UserMenu />
        </AuthProvider>
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      });

      render(
        <AuthProvider>
          <UserMenu />
        </AuthProvider>
      );

      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    it('should show user menu when authenticated', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
        },
        session: {
          id: 'session-1',
          userId: '1',
          expires: new Date(),
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        isPending: false,
      });

      render(
        <AuthProvider>
          <UserMenu />
        </AuthProvider>
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should handle sign out', async () => {
      const user = userEvent.setup();
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
        },
        session: {
          id: 'session-1',
          userId: '1',
          expires: new Date(),
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        isPending: false,
      });

      mockSignOut.mockResolvedValue({});

      render(
        <AuthProvider>
          <UserMenu />
        </AuthProvider>
      );

      // Click to open menu
      const userButton = screen.getByText('Test User');
      await user.click(userButton);

      // Click sign out
      const signOutButton = screen.getByText('Sign Out');
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('PasswordResetForm', () => {
    it('should render password reset form', () => {
      render(<PasswordResetForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('should handle password reset request', async () => {
      const user = userEvent.setup();
      mockForgetPassword.mockResolvedValue({ error: null });

      render(<PasswordResetForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockForgetPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          redirectTo: '/auth/reset-password',
        });
      });
    });

    it('should show success message after reset email sent', async () => {
      const user = userEvent.setup();
      mockForgetPassword.mockResolvedValue({ error: null });

      render(<PasswordResetForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Reset email sent!')).toBeInTheDocument();
        expect(screen.getByText(/we've sent a password reset link/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(<PasswordResetForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      expect(mockForgetPassword).not.toHaveBeenCalled();
    });
  });

  describe('PasswordChangeForm', () => {
    // Mock fetch for password change API
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should render password change form', () => {
      render(<PasswordChangeForm />);

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('should handle successful password change', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Password changed successfully' }),
      });

      render(<PasswordChangeForm />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: 'oldpassword123',
            newPassword: 'NewPassword123',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      render(<PasswordChangeForm />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();

      render(<PasswordChangeForm />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await user.type(currentPasswordInput, 'oldpassword123');
      await user.type(newPasswordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});