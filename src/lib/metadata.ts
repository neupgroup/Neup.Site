import { getSite } from '@/actions/editor/site';

/**
 * Generate page metadata with site name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @returns Metadata object with formatted title
 */
export async function generatePageMetadata(pageTitle: string) {
    const { site } = await getSite();
    const siteName = site?.name || 'Site';

    return {
        title: `${pageTitle}, ${siteName}`,
    };
}
