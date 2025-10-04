
'use client';

import { useState, useEffect, use } from 'react';
import { getTemplate, saveTemplate, type Template } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AlertCircle, Code, Braces } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
        setJsonContent(JSON.stringify(result.template.elements || [], null, 2));
        setReactContent(result.template.reactComponent || '');
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
    
    let elements;
    try {
        elements = template.usableOn?.includes('json') ? JSON.parse(jsonContent) : template.elements;
    } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The JSON content is not correctly formatted.' });
        setIsSaving(false);
        return;
    }

    const result = await saveTemplate({
      ...template,
      elements: elements,
      reactComponent: template.usableOn?.includes('react') ? reactContent : template.reactComponent,
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

  const showJsonEditor = template.usableOn?.includes('json');
  const showReactEditor = template.usableOn?.includes('react');

  return (
    <div className="space-y-6">
        {showJsonEditor && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Braces/> JSON Definition</CardTitle>
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
        )}

        {showReactEditor && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Code/> React Component Code</CardTitle>
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
        )}

        <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm">
             <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Content
            </Button>
        </div>
    </div>
  );
}
