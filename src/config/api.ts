/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const configuredWsURL = import.meta.env.VITE_WS_URL;
const derivedWsURL = apiBaseURL.startsWith('http://') || apiBaseURL.startsWith('https://')
  ? apiBaseURL.replace(/^http/, 'ws')
  : '';

export const API_CONFIG = {
  // Base URLs
  baseURL: apiBaseURL,
  wsURL: configuredWsURL !== undefined ? configuredWsURL : derivedWsURL,
  
  // Timeouts
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Endpoints
  endpoints: {
    // Swap endpoints
    currencies: '/swap/currencies',
    providers: '/swap/providers',
    pairs: '/swap/pairs',
    rates: '/swap/rates',
    estimate: '/swap/estimate',
    donationTarget: '/swap/donation/target',
    donationRates: '/swap/donation/rates',
    donationCreate: '/swap/donation/create',
    swapCreate: '/swap/create',
    swapStatus: '/swap',
    swapHistory: '/swap/history',
    validateAddress: '/swap/validate-address',
    
    // Auth endpoints
    authRegister: '/auth/register',
    authLogin: '/auth/login',
    authLogout: '/auth/logout',
    authMe: '/auth/me',
    authForgotPassword: '/auth/forgot-password',
    authResetPassword: '/auth/reset-password',
    authRequestVerification: '/auth/request-verification',
    authVerifyEmail: '/auth/verify-email',

    // Gift card endpoints
    giftcardsCatalog: '/giftcards',
    giftcardsPrepaid: '/giftcards/prepaid',
    giftcardsOrder: '/giftcards/order',
    giftcardsOrderStatus: '/giftcards/orders',
  },
  
  // Request settings
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

export default API_CONFIG;
