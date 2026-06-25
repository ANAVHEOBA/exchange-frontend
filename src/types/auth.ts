/**
 * Authentication Types
 * POST /auth/register - Register new user
 * POST /auth/login - Login user
 * POST /auth/logout - Logout user
 * GET /auth/me - Get current user
 */

export interface User {
  id: string;                    // User ID (UUID)
  email: string;                 // User email
  username: string;              // Username
  email_verified: boolean;       // Email verification status
  two_factor_enabled: boolean;   // 2FA status
  created_at: string;            // ISO 8601 creation time
  updated_at: string;            // ISO 8601 last update time
  total_trades?: number;         // Dashboard total trades
  traded_value_btc?: number;     // Dashboard traded value in BTC
}

export interface RegisterRequest {
  username: string;              // Username (mandatory)
  email: string;                 // Email address (mandatory)
  password: string;              // Password (mandatory)
  password_confirm: string;      // Password confirmation (mandatory)
}

export interface RegisterResponse {
  user: User;                    // Created user object
}

export interface RequestVerificationRequest {
  email: string;                 // Email address for resending verification
}

export interface RequestVerificationResponse {
  message: string;               // Confirmation message
}

export interface LoginRequest {
  email: string;                 // Email address (mandatory)
  password: string;              // Password (mandatory)
}

export interface LoginResponse {
  access_token: string;          // JWT access token
  refresh_token: string;         // JWT refresh token
  token_type: string;            // Token type (e.g., "Bearer")
  expires_in: number;            // Token expiration time in seconds
}

export interface LoginError {
  error: string;                 // Error message
}

export interface LogoutResponse {
  message: string;               // Logout confirmation message
}

export interface MeResponse {
  email: string;                 // Current user email
  username?: string | null;      // Current user username
  total_trades: number;          // Dashboard total trades
  traded_value_btc: number;      // Dashboard traded value
}

export interface ForgotPasswordRequest {
  email: string;                 // Account email address
}

export interface ForgotPasswordResponse {
  message: string;               // Reset request confirmation
}

export interface ResetPasswordRequest {
  token: string;                 // Password reset token
  password: string;              // New password
  password_confirm: string;      // Password confirmation
}

export interface ResetPasswordResponse {
  message: string;               // Password reset confirmation
}

export interface VerifyEmailRequest {
  token: string;                 // Email verification token (query parameter)
}

export interface VerifyEmailResponse {
  message: string;               // Success message
  user?: User;                   // Verified user object (optional)
}

export interface VerifyEmailError {
  error: string;                 // Error message
}
