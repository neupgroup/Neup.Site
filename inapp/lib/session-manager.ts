/**
 * Session Management Utilities
 * Handles session validation and synchronization between cookies and sessionStorage
 */

const COOKIE_ARTIFACT_ID = 'assetId';
const COOKIE_LAST_FETCH = 'lastFetch';
const SESSION_ARTIFACT_ID = 'sessionAssetId';
const SESSION_LAST_FETCH = 'lastFetch';

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

/**
 * Set a cookie value
 */
export function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

/**
 * Update the last fetch timestamp in both cookies and sessionStorage
 * Call this after successfully fetching fresh data from the server
 */
export function updateLastFetch() {
    const timestamp = Date.now().toString();

    // Save to cookies
    setCookie(COOKIE_LAST_FETCH, timestamp);

    // Save to sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_LAST_FETCH, timestamp);
    }
}

/**
 * Clear session data (for logout)
 */
export function clearSession() {
    // Clear assetId from cookie
    deleteCookie(COOKIE_ARTIFACT_ID);
    deleteCookie(COOKIE_LAST_FETCH);

    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_ARTIFACT_ID);
        sessionStorage.removeItem(SESSION_LAST_FETCH);
        sessionStorage.removeItem('assetProfileData');
    }
}

/**
 * Check if session needs to be refreshed
 * Returns true if session is valid, false if it needs refresh
 */
export function validateSession(): { valid: boolean; reason?: string } {
    if (typeof sessionStorage === 'undefined') {
        return { valid: false, reason: 'sessionStorage not available' };
    }

    const cookieAssetId = getCookie(COOKIE_ARTIFACT_ID);
    const sessionAssetId = sessionStorage.getItem(SESSION_ARTIFACT_ID);

    // Check if siteIds match
    if (cookieAssetId !== sessionAssetId) {
        return { valid: false, reason: 'assetId mismatch' };
    }

    // Check if lastFetch exists in both cookies and sessionStorage
    const cookieLastFetch = getCookie(COOKIE_LAST_FETCH);
    const sessionLastFetch = sessionStorage.getItem(SESSION_LAST_FETCH);

    // If lastFetch doesn't exist in either location, show reload popup
    if (!cookieLastFetch || !sessionLastFetch) {
        return { valid: false, reason: 'lastFetch missing (needs initialization)' };
    }

    // Check if cookie's lastFetch is newer than sessionStorage's lastFetch
    const cookieFetchTime = parseInt(cookieLastFetch, 10);
    const sessionFetchTime = parseInt(sessionLastFetch, 10);

    // If cookie's lastFetch is newer, it means data was updated elsewhere
    if (cookieFetchTime > sessionFetchTime) {
        return { valid: false, reason: 'data updated elsewhere (cookie lastFetch is newer)' };
    }

    return { valid: true };
}

/**
 * Save session data after successful fetch
 */
export function saveSessionData(assetId: string) {
    const timestamp = Date.now().toString();

    // Save to cookies
    setCookie(COOKIE_ARTIFACT_ID, assetId);
    setCookie(COOKIE_LAST_FETCH, timestamp);

    // Save to sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_ARTIFACT_ID, assetId);
        sessionStorage.setItem(SESSION_LAST_FETCH, timestamp);
    }
}

/**
 * Get session metadata for debugging
 */
export function getSessionMetadata() {
    return {
        cookieAssetId: getCookie(COOKIE_ARTIFACT_ID),
        cookieLastFetch: getCookie(COOKIE_LAST_FETCH),
        sessionAssetId: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_ARTIFACT_ID) : null,
        sessionLastFetch: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_LAST_FETCH) : null,
    };
}
