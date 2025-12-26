
'use client';

import { useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';

/**
 * Custom hook to set page title with site name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @param siteNameOverride - Optional override for the site name
 */
export function usePageTitle(pageTitle: string, siteNameOverride?: string) {
    const { site } = useProfile();

    useEffect(() => {
        const siteName = siteNameOverride || site?.name || 'Site';
        document.title = `${pageTitle}, ${siteName}`;
    }, [pageTitle, site?.name, siteNameOverride]);
}
