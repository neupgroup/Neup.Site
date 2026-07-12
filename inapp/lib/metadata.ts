import { getAsset } from '@/services/editor/asset';

/**
 * Generate page metadata with asset name
 * @param pageTitle - The title of the current page (e.g., "Home", "Status", "Settings")
 * @returns Metadata object with formatted title
 */
export async function generatePageMetadata(pageTitle: string) {
    const { asset } = await getAsset();
    const assetName = asset?.name || 'Asset';

    return {
        title: `${pageTitle}, ${assetName}`,
    };
}
