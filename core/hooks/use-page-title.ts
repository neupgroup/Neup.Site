
'use client';

import { useEffect } from 'react';
import { useProfile } from '@/core/context/ProfileContext';

/**
 * Custom hook to set page title with artifact name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @param artifactNameOverride - Optional override for the artifact name
 */
export function usePageTitle(pageTitle: string, artifactNameOverride?: string) {
    const { artifact } = useProfile();

    useEffect(() => {
        const artifactName = artifactNameOverride || artifact?.name || 'Artifact';
        document.title = `${pageTitle}, ${artifactName}`;
    }, [pageTitle, artifact?.name, artifactNameOverride]);
}
