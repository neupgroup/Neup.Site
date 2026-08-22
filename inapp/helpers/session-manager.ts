/*
::neup.documentation::inapp-helper-session-manager
::title Browser Session Manager

Synchronizes lightweight browser session metadata between the active URL and sessionStorage.

::public

Use these helpers from client-side code that needs to validate whether cached asset profile data still belongs to the active `selectedProject` URL parameter.

::public end

::private

This module only reads browser-native `document.cookie` and `sessionStorage` so in-app client surfaces can validate cached profile data without importing app services.

::private end

::end
*/

const COOKIE_LAST_FETCH = 'lastFetch';
const SESSION_SELECTED_PROJECT = 'sessionSelectedProject';
const SESSION_LAST_FETCH = 'lastFetch';

export function getSelectedProjectIdFromLocation(): string | null {
    if (typeof window === 'undefined') return null;

    const value = new URLSearchParams(window.location.search).get('selectedProject');
    return value?.trim() || null;
}

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
    deleteCookie(COOKIE_LAST_FETCH);

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_SELECTED_PROJECT);
        sessionStorage.removeItem(SESSION_LAST_FETCH);
        sessionStorage.removeItem('assetProfileData');
    }
}

export function validateSession(): { valid: boolean; reason?: string } {
    if (typeof sessionStorage === 'undefined') {
        return { valid: false, reason: 'sessionStorage not available' };
    }

    const currentSelectedProject = getSelectedProjectIdFromLocation();
    const sessionSelectedProject = sessionStorage.getItem(SESSION_SELECTED_PROJECT);

    if (currentSelectedProject !== sessionSelectedProject) {
        return { valid: false, reason: 'selectedProject mismatch' };
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

    setCookie(COOKIE_LAST_FETCH, timestamp);

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_SELECTED_PROJECT, assetId);
        sessionStorage.setItem(SESSION_LAST_FETCH, timestamp);
    }
}

export function getSessionMetadata() {
    return {
        selectedProject: getSelectedProjectIdFromLocation(),
        cookieLastFetch: getCookie(COOKIE_LAST_FETCH),
        sessionSelectedProject: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_SELECTED_PROJECT) : null,
        sessionLastFetch: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_LAST_FETCH) : null,
    };
}
