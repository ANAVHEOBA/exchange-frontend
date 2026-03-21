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
  RegisterRequest, 
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  VerifyEmailResponse
} from '../../types/auth';

/**
 * Register a new user
 * Creates a new user account with email and password
 */
export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  const url = API_CONFIG.endpoints.authRegister;
  return apiClient.post<RegisterResponse>(url, request);
}

/**
 * Login user
 * Authenticates user with email and password
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const url = API_CONFIG.endpoints.authLogin;
  return apiClient.post<LoginResponse>(url, request);
}

/**
 * Logout current user
 * Invalidates the current session
 */
export async function logout(): Promise<LogoutResponse> {
  const url = API_CONFIG.endpoints.authLogout;
  return apiClient.post<LogoutResponse>(url, {});
}

/**
 * Get current user
 * Returns the currently authenticated user
 */
export async function getCurrentUser(): Promise<MeResponse> {
  const url = API_CONFIG.endpoints.authMe;
  return apiClient.get<MeResponse>(url);
}

/**
 * Verify email address
 * Verifies user email with the token sent via email
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const url = `${API_CONFIG.endpoints.authVerifyEmail}?token=${encodeURIComponent(token)}`;
  return apiClient.get<VerifyEmailResponse>(url);
}
