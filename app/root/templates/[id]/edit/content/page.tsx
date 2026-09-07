
'use client';

import { useState, useEffect, use } from 'react';
import { getTemplate, saveTemplate } from '@/services/editor/templates';
import { Template } from '@/services/template/type';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Textarea } from '#/components/ui/textarea';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { useToast } from '#/core/hooks/useToast';
import { Save, Loader2, AlertCircle, Code, Braces } from 'lucide-react';
import { Label } from '#/components/ui/label';

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<Template | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [reactContent, setReactContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        setTemplate(result.template);
        setJsonContent(JSON.stringify(result.template.content?.json || [], null, 2));
        setReactContent(result.template.content?.react || '');
      } else {
        setError(result.error || 'Failed to load template.');
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [id]);

  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    
    let parsedJson;
    let usableOn: ('json' | 'react')[] = [];

    try {
        if (jsonContent.trim() && jsonContent.trim() !== '[]') {
            parsedJson = JSON.parse(jsonContent);
            usableOn.push('json');
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The JSON content is not correctly formatted.' });
        setIsSaving(false);
        return;
    }

    if (reactContent.trim()) {
        usableOn.push('react');
    }

    const newContent = {
        json: parsedJson || template.content.json,
        react: reactContent || template.content.react,
    };

    const result = await saveTemplate({
      ...template,
      content: newContent,
      usableOn: usableOn.length > 0 ? usableOn : ['json'], // Default to json if both are empty
    }, id);

    if (result.success) {
      toast({ title: 'Content Saved', description: 'The template content has been updated.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!template) return null;

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Braces/> JSON Definition</CardTitle>
                 <CardDescription>This content is used by the visual Drag & Drop editor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="json-content">Editor Elements (JSON Array)</Label>
                    <Textarea
                        id="json-content"
                        value={jsonContent}
                        onChange={(e) => setJsonContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder='[ { "id": "el-1", ... } ]'
                    />
                </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code/> React Component Code</CardTitle>
                <CardDescription>This content can be used directly in your codebase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="react-content">React/JSX Code</Label>
                    <Textarea
                        id="react-content"
                        value={reactContent}
                        onChange={(e) => setReactContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder={`export default function MyTemplate({ item }) {\n  return <div>{item.name}</div>;\n}`}
                    />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm">
             <Button variant="solid" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Content
            </Button>
        </div>
    </div>
  );
}
