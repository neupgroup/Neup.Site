
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPage, savePage } from '@/actions/editor/pages';
import { getTemplates, type Template } from '@/actions/editor/templates';
import { getSections, type Section } from '@/actions/editor/sections';
import type { CanvasElementData } from '@/schemas/canvas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { logErrorToFirestore } from '@/lib/logging';

// A unified interface for items in the section library
interface LibraryItem {
    id: string;
    name: string;
    description?: string;
    content: CanvasElementData[];
    sourceType: 'template' | 'section';
}

export default function PrebuiltEditorPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [pageElements, setPageElements] = useState<CanvasElementData[]>([]);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!id) {
            setError('No page ID provided.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [pageResult, templatesResult, sectionsResult] = await Promise.all([
                    getPage(id), 
                    getTemplates(),
                    getSections(),
                ]);

                if (pageResult.success && pageResult.page) {
                    setPageElements(pageResult.page.elements || []);
                } else {
                    setError(pageResult.error || 'Failed to load page data.');
                }
                
                const combinedLibrary: LibraryItem[] = [];

                if (templatesResult.success && templatesResult.templates) {
                    const filteredTemplates = templatesResult.templates
                        .filter(t => t.type === 'section' && t.usableOn.includes('json') && t.content?.json && t.content.json.length > 0)
                        .map(t => ({
                            id: t.id,
                            name: t.name,
                            description: t.description,
                            content: t.content.json!,
                            sourceType: 'template' as const,
                        }));
                    combinedLibrary.push(...filteredTemplates);
                } else {
                    setError(prev => (prev ? `${prev} And failed to load templates: ${templatesResult.error}` : templatesResult.error || 'Failed to load templates.'));
                }

                if (sectionsResult.success && sectionsResult.sections) {
                    const mappedSections = sectionsResult.sections.map(s => {
                        try {
                            const parsedContent = JSON.parse(s.content);
                            return {
                                id: s.id,
                                name: s.name,
                                description: `Custom section of type: ${s.type}`,
                                content: Array.isArray(parsedContent) ? parsedContent : [parsedContent],
                                sourceType: 'section' as const,
                            }
                        } catch {
                            return null;
                        }
                    }).filter((s): s is LibraryItem => s !== null && s.content.length > 0);
                    combinedLibrary.push(...mappedSections);
                } else {
                     setError(prev => (prev ? `${prev} And failed to load sections: ${sectionsResult.error}` : sectionsResult.error || 'Failed to load sections.'));
                }
                
                setLibraryItems(combinedLibrary);

            } catch (e: any) {
                setError('An unexpected error occurred while fetching data.');
                 await logErrorToFirestore({
                    message: e.message,
                    stack: e.stack,
                    source: 'PrebuiltEditorPage.fetchData',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const addSection = (item: LibraryItem) => {
        const content = item.content;
        if (!content || !Array.isArray(content) || content.length === 0) {
            const errorMsg = `Library item "${item.name}" (ID: ${item.id}) has no valid content to add.`;
            toast({ variant: 'destructive', title: 'Empty Item', description: 'This item has no content to add.' });
            logErrorToFirestore({
                message: errorMsg,
                source: 'PrebuiltEditorPage.addSection',
                details: `Attempted to add a library item where 'content' is missing, not an array, or empty.`,
            });
            return;
        }
        
        // Ensure unique ID for the new section instance
        const newSection = {
            ...content[0],
            id: `${content[0].id}-${Date.now()}` 
        };
        setPageElements(prev => [...prev, newSection]);
    };

    const removeSection = (index: number) => {
        setPageElements(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        const result = await savePage(id, { elements: pageElements });
        if (result.success) {
            toast({ title: 'Page Saved', description: 'The page structure has been updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    if (loading) {
        return <div className="p-4 space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    }
     if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex flex-col gap-4">
                 <Button asChild variant="ghost" className="mb-4 self-start">
                    <Link href={`/site/pages/${id}/edit`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Edit Options
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Section Library</CardTitle>
                        <CardDescription>Click a section to add it to your page below.</CardDescription>
                    </CardHeader>
                    <ScrollArea className="max-h-96">
                        <CardContent className="space-y-2">
                            {libraryItems.map(item => (
                                 <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => addSection(item)}>
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Page Sections</CardTitle>
                        <CardDescription>The sections currently on your page. Drag to reorder.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {pageElements.map((element, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <span className="font-mono text-sm">{element.id} ({element.type})</span>
                                    <Button variant="ghost" size="icon" onClick={() => removeSection(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                             {pageElements.length === 0 && (
                                <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                                    <p>Add sections from the library above to begin.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                 <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Page
                    </Button>
                </div>
            </div>
        </div>
    );
}
