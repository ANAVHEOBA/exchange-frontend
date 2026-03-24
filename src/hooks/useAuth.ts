/**
 * useAuth Hook
 * Hook for accessing auth session data and operations
 */

import { authStore } from '../stores/authStore';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export function useAuth() {
  return {
    session: authStore.session,
    user: authStore.user,
    token: authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    loading: authStore.loading,
    initialized: authStore.initialized,
    error: authStore.error,
    lastLoginResponse: authStore.lastLoginResponse,

    initialize: authStore.initializeAuth,
    register: (request: RegisterRequest) => authStore.register(request),
    login: (request: LoginRequest) => authStore.login(request),
    logout: authStore.logout,
    refreshUser: authStore.refreshUser,
    verifyEmail: authStore.verifyEmail,
    clearSession: authStore.clearSession,
    clearError: authStore.clearError,
  };
}
