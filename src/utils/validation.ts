/**
 * Sanitizes free-text input to prevent basic injection attempts
 * while allowing legitimate punctuation.
 * - Strips SQL comment markers (--)
 * - Strips characters used in SQL injection / XSS (; ' " \ * < >)
 * - Allows single hyphens and slashes
 * - Trims leading/trailing whitespace
 */
export const sanitizeText = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/--/g, '')
    .replace(/[;'"\\*<>]/g, '')
    .trimStart(); // Only trim start to allow typing spaces, trim end on blur or submit if needed
};

// Common limits
export const LIMITS = {
  TOURNAMENT_NAME: 100,
  LOCATION: 150,
  CATEGORY_NAME: 50,
  PLAYER_NAME: 80,
  USERNAME: 50,
};
