/**
 * Normalize WhatsApp phone number to international format (Indonesia: 62xxx)
 * - Removes all non-digit characters
 * - Converts local format (08xx) to international format (628xx)
 * - Handles already-normalized numbers
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  if (!digitsOnly) {
    throw new Error('Phone number must contain at least one digit');
  }

  // If starts with 0 (local format), replace with 62
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }

  // If already starts with 62 or another country code, return as is
  return digitsOnly;
};
