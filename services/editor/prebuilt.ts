
'use server';

import { getPage } from '@/server/editor/pages';
import { getTemplates } from '@/server/editor/templates';
import { getSections } from '@/server/editor/sections';
import type { CanvasElementData } from '@/schemas/canvas';
import { logErrorToDatabase } from '@/lib/logging';

export interface LibraryItem {
    id: string;
    name: string;
    description?: string;
    jsonContent: CanvasElementData[];
    reactContent: string;
    sourceType: 'template' | 'section';
}

interface PrebuiltEditorData {
    pageElements: CanvasElementData[];
    libraryItems: LibraryItem[];
}

export async function getPrebuiltEditorData(id: string): Promise<{ success: boolean; data?: PrebuiltEditorData; error?: string }> {
    try {
        const [pageResult, templatesResult, sectionsResult] = await Promise.all([
            getPage(id),
            getTemplates(),
            getSections(),
        ]);

        if (!pageResult.success) {
            return { success: false, error: pageResult.error || 'Failed to load page data.' };
        }
        const pageElements = pageResult.page?.elements || [];

        const combinedLibrary: LibraryItem[] = [];

        if (templatesResult.success && templatesResult.templates) {
            const mappedTemplates = templatesResult.templates
                .filter(t => t.status === 'published')
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    jsonContent: t.content?.json || [],
                    reactContent: t.content?.react || '',
                    sourceType: 'template' as const,
                }));
            combinedLibrary.push(...mappedTemplates);
        } else {
             console.error("Failed to load templates:", templatesResult.error);
        }

        if (sectionsResult.success && sectionsResult.sections) {
            const mappedSections = sectionsResult.sections.map(s => {
                let content: CanvasElementData[] = [];
                try {
                    const parsed = JSON.parse(s.content);
                    const contentArray = Array.isArray(parsed) ? parsed : [parsed];
                    const validContent = contentArray.filter(el => el && typeof el === 'object' && el.id);
                    if (validContent.length > 0) {
                        content = validContent;
                    }
                } catch (e) {
                   // If JSON parsing fails, content remains an empty array.
                }
                return {
                    id: s.id,
                    name: s.name,
                    description: s.description || 'Custom section',
                    jsonContent: content,
                    reactContent: '',
                    sourceType: 'section' as const,
                };
            });
            combinedLibrary.push(...mappedSections);
        } else {
            console.error("Failed to load sections:", sectionsResult.error);
        }

        return { success: true, data: { pageElements, libraryItems: combinedLibrary } };

    } catch (e: any) {
        await logErrorToDatabase({
            message: e.message,
            stack: e.stack,
            source: 'getPrebuiltEditorData',
        });
        return { success: false, error: 'An unexpected error occurred while fetching data.' };
    }
}
