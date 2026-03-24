/**
 * Session Service
 * Handles auth session persistence and user restoration
 */

import { authApi } from '../../api/endpoints/auth';
import { logger } from '../../utils/logger';
import type { StoredAuthToken } from '../../api/client';
import type { ApiError } from '../../types/api';
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  VerifyEmailResponse,
} from '../../types/auth';

const USER_STORAGE_KEY = 'exchange.user';

export interface SessionState {
  token: StoredAuthToken | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginSessionResult extends SessionState {
  loginResponse: LoginResponse;
}

const buildSessionState = (
  token: StoredAuthToken | null,
  user: User | null,
): SessionState => ({
  token,
  user,
  isAuthenticated: Boolean(token?.accessToken),
});

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as ApiError).status;
  }

  return undefined;
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const persistUser = (user: User | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!user) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures so auth flows still work in restricted environments.
  }
};

const loadCurrentUser = async (): Promise<User> => {
  const response = await authApi.getCurrentUser();
  persistUser(response.user);
  return response.user;
};

const clearSession = (): void => {
  authApi.clearSession();
  persistUser(null);
};

export const sessionService = {
  getStoredUser: readStoredUser,

  getSession(): SessionState {
    return buildSessionState(authApi.getSession(), readStoredUser());
  },

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return authApi.register(request);
  },

  async login(request: LoginRequest): Promise<LoginSessionResult> {
    const loginResponse = await authApi.loginAndStoreSession(request);

    let user = readStoredUser();
    try {
      user = await loadCurrentUser();
    } catch (error) {
      logger.warn('Login succeeded, but fetching the current user failed', error);
    }

    return {
      ...buildSessionState(authApi.getSession(), user),
      loginResponse,
    };
  },

  async logout(): Promise<LogoutResponse> {
    try {
      return await authApi.logoutAndClearSession();
    } finally {
      clearSession();
    }
  },

  loadCurrentUser,

  async restoreSession(): Promise<SessionState> {
    const token = authApi.getSession();
    const cachedUser = readStoredUser();

    if (!token) {
      clearSession();
      return buildSessionState(null, null);
    }

    try {
      const user = await loadCurrentUser();
      return buildSessionState(authApi.getSession(), user);
    } catch (error) {
      const status = getErrorStatus(error);

      if (status === 401 || status === 403) {
        clearSession();
        return buildSessionState(null, null);
      }

      if (cachedUser) {
        logger.warn('Using cached user because session refresh failed', error);
        return buildSessionState(token, cachedUser);
      }

      throw error;
    }
  },

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await authApi.verifyEmail(token);

    if (response.user) {
      persistUser(response.user);
    }

    return response;
  },

  clearSession,
};
