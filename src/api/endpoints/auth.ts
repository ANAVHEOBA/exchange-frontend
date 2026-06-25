/**
 * Authentication API Endpoints
 * POST /auth/register - Register new user
 * POST /auth/login - Login user
 * POST /auth/logout - Logout user
 * GET /auth/me - Get current user
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { 
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RegisterRequest, 
  RegisterResponse,
  RequestVerificationRequest,
  RequestVerificationResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailResponse
} from '../../types/auth';

const registerUser = async (request: RegisterRequest): Promise<RegisterResponse> => {
  return apiClient.post<RegisterResponse>(API_CONFIG.endpoints.authRegister, request);
};

const loginUser = async (request: LoginRequest): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>(API_CONFIG.endpoints.authLogin, request);
};

const requestVerificationRequest = async (
  request: RequestVerificationRequest,
): Promise<RequestVerificationResponse> => {
  return apiClient.post<RequestVerificationResponse>(
    API_CONFIG.endpoints.authRequestVerification,
    request,
  );
};

const forgotPasswordRequest = async (
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  return apiClient.post<ForgotPasswordResponse>(
    API_CONFIG.endpoints.authForgotPassword,
    request,
  );
};

const resetPasswordRequest = async (
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  return apiClient.post<ResetPasswordResponse>(
    API_CONFIG.endpoints.authResetPassword,
    request,
  );
};

const logoutUser = async (): Promise<LogoutResponse> => {
  return apiClient.post<LogoutResponse>(API_CONFIG.endpoints.authLogout, {});
};

const getCurrentUserRequest = async (): Promise<MeResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<MeResponse>(API_CONFIG.endpoints.authMe)
  );
};

const verifyEmailRequest = async (token: string): Promise<VerifyEmailResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<VerifyEmailResponse>(API_CONFIG.endpoints.authVerifyEmail, { token })
  );
};

const storeSession = (response: LoginResponse): void => {
  apiClient.setAuthToken(response.access_token, response.token_type);
};

const clearSession = (): void => {
  apiClient.clearAuthToken();
};

export const authApi = {
  /**
   * Register a new user
   * Creates a new user account with email and password
   */
  register: registerUser,

  /**
   * Login user
   * Authenticates user with email and password
   */
  login: loginUser,

  /**
   * Request a fresh verification email for an unverified account
   */
  requestVerification: requestVerificationRequest,

  /**
   * Login user and persist the access token for protected requests
   */
  async loginAndStoreSession(request: LoginRequest): Promise<LoginResponse> {
    const response = await loginUser(request);
    storeSession(response);
    return response;
  },

  /**
   * Request a password reset email
   */
  forgotPassword: forgotPasswordRequest,

  /**
   * Complete a password reset using a valid token
   */
  resetPassword: resetPasswordRequest,

  /**
   * Logout current user
   * Invalidates the current session
   */
  logout: logoutUser,

  /**
   * Logout and clear the locally stored access token
   */
  async logoutAndClearSession(): Promise<LogoutResponse> {
    const response = await logoutUser();
    clearSession();
    return response;
  },

  /**
   * Get current user
   * Returns the currently authenticated user
   */
  getCurrentUser: getCurrentUserRequest,

  /**
   * Verify email address
   * Verifies user email with the token sent via email
   */
  verifyEmail: verifyEmailRequest,

  /**
   * Persist a session from a successful login response
   */
  storeSession,

  /**
   * Clear the locally stored session token
   */
  clearSession,

  /**
   * Inspect the current locally stored session token
   */
  getSession: () => apiClient.getAuthToken(),
};

export const register = authApi.register;
export const login = authApi.login;
export const logout = authApi.logout;
export const getCurrentUser = authApi.getCurrentUser;
export const forgotPassword = authApi.forgotPassword;
export const requestVerification = authApi.requestVerification;
export const resetPassword = authApi.resetPassword;
export const verifyEmail = authApi.verifyEmail;
