
'use client';

import { useEffect } from 'react';
import { useProfile } from '@/core/context/ProfileContext';

/**
 * Custom hook to set page title with asset name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @param assetNameOverride - Optional override for the asset name
 */
export function usePageTitle(pageTitle: string, assetNameOverride?: string) {
    const { asset } = useProfile();

    useEffect(() => {
        const assetName = assetNameOverride || asset?.name || 'Asset';
        document.title = `${pageTitle}, ${assetName}`;
    }, [pageTitle, asset?.name, assetNameOverride]);
}
