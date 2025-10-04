
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPage, savePage } from '@/actions/editor/pages';
import { getTemplates, type Template } from '@/actions/editor/templates';
import type { CanvasElementData } from '@/schemas/canvas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function PrebuiltEditorPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [pageElements, setPageElements] = useState<CanvasElementData[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
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
                const [pageResult, templatesResult] = await Promise.all([getPage(id), getTemplates()]);

                if (pageResult.success && pageResult.page) {
                    setPageElements(pageResult.page.elements || []);
                } else {
                    setError(pageResult.error || 'Failed to load page data.');
                }

                if (templatesResult.success && templatesResult.templates) {
                    setTemplates(templatesResult.templates.filter(t => t.type === 'section'));
                } else {
                    setError(prev => prev ? `${prev} And failed to load templates: ${templatesResult.error}` : templatesResult.error || 'Failed to load templates.');
                }
            } catch (e: any) {
                setError('An unexpected error occurred while fetching data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const addSection = (template: Template) => {
        const jsonContent = template.content?.json;
        if (!jsonContent || jsonContent.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Template', description: 'This template has no content to add.' });
            return;
        }
        
        const newSection = {
            ...jsonContent[0],
            id: `${jsonContent[0].id}-${Date.now()}` // Ensure unique ID
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
                            {templates.map(template => (
                                 <div key={template.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{template.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => addSection(template)}>
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
