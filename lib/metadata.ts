import { getArtifact } from '@/server/editor/artifact';

/**
 * Generate page metadata with artifact name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @returns Metadata object with formatted title
 */
export async function generatePageMetadata(pageTitle: string) {
    const { artifact } = await getArtifact();
    const artifactName = artifact?.name || 'Artifact';

    return {
        title: `${pageTitle}, ${artifactName}`,
    };
}
