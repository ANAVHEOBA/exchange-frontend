/**
 * Auth Store
 * State management for session restoration and auth flows
 */

import { createMemo, createSignal } from 'solid-js';
import { sessionService, type LoginSessionResult, type SessionState } from '../services/auth/sessionService';
import { logger } from '../utils/logger';
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  RequestVerificationRequest,
  RequestVerificationResponse,
  User,
  VerifyEmailResponse,
} from '../types/auth';

const EMPTY_SESSION: SessionState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const [session, setSession] = createSignal<SessionState>(EMPTY_SESSION);
const [loading, setLoading] = createSignal(false);
const [initialized, setInitialized] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);
const [lastLoginResponse, setLastLoginResponse] = createSignal<LoginResponse | null>(null);
let initializePromise: Promise<SessionState> | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error';
};

const setStoreError = (error: unknown) => {
  const message = getErrorMessage(error);
  setError(message);
  logger.error(message, error);
};

const clearError = () => {
  setError(null);
};

const user = createMemo(() => session().user);
const token = createMemo(() => session().token);
const isAuthenticated = createMemo(() => session().isAuthenticated);

const initializeAuth = async (): Promise<SessionState> => {
  if (initialized()) {
    return session();
  }

  if (initializePromise) {
    return initializePromise;
  }

  clearError();
  setLoading(true);
  initializePromise = (async () => {
    try {
      const nextSession = await sessionService.restoreSession();
      setSession(nextSession);
      return nextSession;
    } catch (error) {
      setStoreError(error);
      throw error;
    } finally {
      initializePromise = null;
      setLoading(false);
      setInitialized(true);
    }
  })();

  return initializePromise;
};

const register = async (request: RegisterRequest): Promise<RegisterResponse> => {
  clearError();
  setLoading(true);

  try {
    return await sessionService.register(request);
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const login = async (request: LoginRequest): Promise<LoginSessionResult> => {
  clearError();
  setLoading(true);

  try {
    const nextSession = await sessionService.login(request);
    setSession({
      token: nextSession.token,
      user: nextSession.user,
      isAuthenticated: nextSession.isAuthenticated,
    });
    setLastLoginResponse(nextSession.loginResponse);
    setInitialized(true);
    return nextSession;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const requestVerification = async (
  request: RequestVerificationRequest,
): Promise<RequestVerificationResponse> => {
  clearError();
  setLoading(true);

  try {
    return await sessionService.requestVerification(request);
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const logout = async (): Promise<LogoutResponse> => {
  clearError();
  setLoading(true);

  try {
    const response = await sessionService.logout();
    setSession(sessionService.getSession());
    setLastLoginResponse(null);
    setInitialized(true);
    return response;
  } catch (error) {
    setSession(sessionService.getSession());
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const refreshUser = async (): Promise<User> => {
  clearError();
  setLoading(true);

  try {
    const nextUser = await sessionService.loadCurrentUser();
    setSession({
      token: sessionService.getSession().token,
      user: nextUser,
      isAuthenticated: true,
    });
    return nextUser;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const verifyEmail = async (verificationToken: string): Promise<VerifyEmailResponse> => {
  clearError();
  setLoading(true);

  try {
    const response = await sessionService.verifyEmail(verificationToken);
    setSession(sessionService.getSession());
    return response;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

const clearSession = () => {
  sessionService.clearSession();
  setSession(sessionService.getSession());
  setLastLoginResponse(null);
  setInitialized(true);
};

export const authStore = {
  session,
  user,
  token,
  isAuthenticated,
  loading,
  initialized,
  error,
  lastLoginResponse,

  initializeAuth,
  register,
  login,
  requestVerification,
  logout,
  refreshUser,
  verifyEmail,
  clearSession,
  clearError,
};
