// Plain-language messages for Supabase sign-in errors (copy.md form errors). The raw
// messages come from Supabase or the SMS provider and can be technical, so they're logged
// to the console for debugging and never shown to the person.
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

const RATE_LIMITED = new Set(['over_sms_send_rate_limit', 'over_request_rate_limit']);

function isRateLimited(error: AuthError): boolean {
  return error.status === 429 || (!!error.code && RATE_LIMITED.has(error.code));
}

/** Message for a failed "send me a code" request. */
export function sendCodeErrorMessage(error: AuthError): string {
  console.error('Sending sign-in code failed:', error);
  if (isAuthRetryableFetchError(error)) {
    return 'We couldn’t reach RePark. Check your connection and try again.';
  }
  if (error.code === 'validation_failed') {
    return 'That number looks too short. Check it and try again.';
  }
  return 'We couldn’t send a text just now. Try again in a minute.';
}

/** Message for a failed "check my code" request. */
export function verifyCodeErrorMessage(error: AuthError): string {
  console.error('Verifying sign-in code failed:', error);
  if (isAuthRetryableFetchError(error)) {
    return 'We couldn’t reach RePark. Check your connection and try again.';
  }
  if (isRateLimited(error)) {
    return 'Too many tries. Wait a minute, then try again.';
  }
  if (error.code === 'otp_expired') {
    return 'That code has expired. Ask for a new one.';
  }
  return 'That code didn’t match. Check the latest text and try again.';
}
