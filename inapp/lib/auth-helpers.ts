/**
 * Authentication and Session Helpers
 * Use these functions for logout and session management
 */

import { clearSession, updateLastFetch } from '@/inapp/helpers/session-manager';

/**
 * Logout function
 * Clears all session data and redirects to login
 */
export async function logout() {
    try {
        // Clear session (cookies and sessionStorage)
        clearSession();

        // Redirect to login page
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Invalidate current session
 * Call this when making significant changes that require a reload
 * (e.g., switching sites, updating critical settings)
 * This updates the lastFetch in cookies, making sessionStorage data appear stale
 */
export function invalidateSession() {
    updateLastFetch();
}

/**
 * Force reload with fresh session data
 */
export function reloadWithFreshSession() {
    clearSession();
    window.location.reload();
}
