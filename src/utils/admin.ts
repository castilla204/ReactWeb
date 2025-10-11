/**
 * Utility functions for admin validation
 */

/**
 * Check if a user is an admin based on their email
 * @param email - User's email address
 * @returns boolean indicating if user is admin
 */
export function isAdmin(email: string | undefined | null): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === 'dcastillaa@gmail.com'.toLowerCase();
}

/**
 * Admin email constant
 */
export const ADMIN_EMAIL = 'dcastillaa@gmail.com';









