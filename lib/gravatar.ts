 
const md5 = require('md5');

/**
 * Generate MD5 hash from email (required for Gravatar)
 * Works in both Node.js (server) and browser environments
 */
function md5Hash(text: string): string {
  return md5(text.trim().toLowerCase());
}

/**
 * Get Gravatar URL for an email address
 * @param email - User's email address
 * @param size - Size of the avatar (default: 200)
 * @param defaultImage - Default image parameter ('404' to return 404 if not found, 'mp' for default, etc.)
 * @returns Gravatar URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 200,
  defaultImage: string = '404'
): string {
  if (!email) {
    return '';
  }

  const hash = md5Hash(email);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Check if a Gravatar exists for an email
 * Uses the 404 default parameter - if Gravatar returns 404, no avatar exists
 * Note: This is an async check that requires a network request
 */
export async function gravatarExists(email: string): Promise<boolean> {
  if (!email) {
    return false;
  }

  try {
    const url = getGravatarUrl(email, 200, '404');
    const response = await fetch(url, { method: 'HEAD' });
    return response.status !== 404;
  } catch {
    // If fetch fails, assume Gravatar exists (optimistic)
    return true;
  }
}

