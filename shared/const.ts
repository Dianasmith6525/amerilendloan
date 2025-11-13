export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Processing Fee Configuration
export const PROCESSING_FEE_PERCENTAGE = 3.6; // 3.6% processing fee on loan amount
export const calculateProcessingFee = (amount: number): number => {
  return Math.round((amount * PROCESSING_FEE_PERCENTAGE / 100) * 100) / 100;
};
