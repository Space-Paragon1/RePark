// Plain-language messages for Supabase sign-in errors. The raw messages come
// from Supabase or the SMS provider and can be technical, so they are logged
// to the console for debugging and never shown to the user.
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

const RATE_LIMITED = new Set(['over_sms_send_rate_limit', 'over_request_rate_limit']);

function isRateLimited(error: AuthError): boolean {
  return error.status === 429 || (!!error.code && RATE_LIMITED.has(error.code));
}

/** Message for a failed "send me a code" request. */
export function sendCodeErrorMessage(error: AuthError): string {
  console.error('Sending sign-in code failed:', error);
  if (isAuthRetryableFetchError(error)) {
    return 'Couldn’t reach RePark. Check your internet connection and try again.';
  }
  if (isRateLimited(error)) {
    return 'Too many codes requested for this number. Wait a minute, then try again.';
  }
  if (error.code === 'validation_failed') {
    return 'That phone number doesn’t look right. Check it and include your country code, e.g. +1.';
  }
  return 'We couldn’t send a text to this number right now. Please try again later.';
}

/** Message for a failed "check my code" request. */
export function verifyCodeErrorMessage(error: AuthError): string {
  console.error('Verifying sign-in code failed:', error);
  if (isAuthRetryableFetchError(error)) {
    return 'Couldn’t reach RePark. Check your internet connection and try again.';
  }
  if (isRateLimited(error)) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  return 'That code is wrong or has expired. Check it, or send a new code.';
}
