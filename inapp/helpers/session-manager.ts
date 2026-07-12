/*
::neup.documentation::inapp-helper-session-manager
::title Browser Session Manager

Synchronizes lightweight browser session metadata between cookies and sessionStorage.

::public

Use these helpers from client-side code that needs to validate whether cached asset profile data still belongs to the active `assetId` cookie.

::public end

::private

This module only reads browser-native `document.cookie` and `sessionStorage` so in-app client surfaces can validate cached profile data without importing app services.

::private end

::end
*/

const COOKIE_ASSET_ID = 'assetId';
const COOKIE_LAST_FETCH = 'lastFetch';
const SESSION_ASSET_ID = 'sessionAssetId';
const SESSION_LAST_FETCH = 'lastFetch';

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

export function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

export function updateLastFetch() {
    const timestamp = Date.now().toString();

    setCookie(COOKIE_LAST_FETCH, timestamp);

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_LAST_FETCH, timestamp);
    }
}

export function clearSession() {
    deleteCookie(COOKIE_ASSET_ID);
    deleteCookie(COOKIE_LAST_FETCH);

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_ASSET_ID);
        sessionStorage.removeItem(SESSION_LAST_FETCH);
        sessionStorage.removeItem('assetProfileData');
    }
}

export function validateSession(): { valid: boolean; reason?: string } {
    if (typeof sessionStorage === 'undefined') {
        return { valid: false, reason: 'sessionStorage not available' };
    }

    const cookieAssetId = getCookie(COOKIE_ASSET_ID);
    const sessionAssetId = sessionStorage.getItem(SESSION_ASSET_ID);

    if (cookieAssetId !== sessionAssetId) {
        return { valid: false, reason: 'assetId mismatch' };
    }

    const cookieLastFetch = getCookie(COOKIE_LAST_FETCH);
    const sessionLastFetch = sessionStorage.getItem(SESSION_LAST_FETCH);

    if (!cookieLastFetch || !sessionLastFetch) {
        return { valid: false, reason: 'lastFetch missing (needs initialization)' };
    }

    const cookieFetchTime = parseInt(cookieLastFetch, 10);
    const sessionFetchTime = parseInt(sessionLastFetch, 10);

    if (cookieFetchTime > sessionFetchTime) {
        return { valid: false, reason: 'data updated elsewhere (cookie lastFetch is newer)' };
    }

    return { valid: true };
}

export function saveSessionData(assetId: string) {
    const timestamp = Date.now().toString();

    setCookie(COOKIE_ASSET_ID, assetId);
    setCookie(COOKIE_LAST_FETCH, timestamp);

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_ASSET_ID, assetId);
        sessionStorage.setItem(SESSION_LAST_FETCH, timestamp);
    }
}

export function getSessionMetadata() {
    return {
        cookieAssetId: getCookie(COOKIE_ASSET_ID),
        cookieLastFetch: getCookie(COOKIE_LAST_FETCH),
        sessionAssetId: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_ASSET_ID) : null,
        sessionLastFetch: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_LAST_FETCH) : null,
    };
}
