import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '~/middleware';

// Mock the auth module
jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

const mockGetSession = require('~/lib/auth').auth.api.getSession;

/**
 * Tests for authentication middleware
 */

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/api/auth/sign-in',
      '/api/auth/sign-up',
    ];

    it.each(publicRoutes)('should allow access to public route: %s', async (route) => {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/auth/login');
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard');
    });

    it('should allow access when authenticated', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-1',
          userId: '1',
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockGetSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should redirect to login on session error', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'));

      const request = new NextRequest('http://localhost:3000/profile');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/auth/login');
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fprofile');
    });
  });

  describe('Route Matching', () => {
    it('should handle nested public routes', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/callback');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should handle query parameters in callback URL', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/dashboard?tab=projects');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard');
    });
  });

  describe('Session Validation', () => {
    it('should call getSession with correct headers', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        session: { id: 'session-1', userId: '1', expires: new Date() },
      };

      mockGetSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          'authorization': 'Bearer token',
          'cookie': 'session=abc123',
        },
      });

      await middleware(request);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: request.headers,
      });
    });
  });
});