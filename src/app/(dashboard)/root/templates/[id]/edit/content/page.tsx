
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplate, saveTemplate, type Template } from '@/actions/editor/templates';
import { refineCode } from '@/ai/flows/refine-code-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AlertCircle, Wand2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function EditContentPage({ params: { id } }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        setTemplate(result.template);
        if (result.template.method === 'codebase' && result.template.elements) {
            setCode(JSON.stringify(result.template.elements, null, 2));
        } else {
            setCode(result.template.code || '');
        }
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
    
    // We only need to pass the code and name. The backend will re-process it.
    const result = await saveTemplate({
      name: template.name,
      description: template.description,
      type: template.type,
      method: template.method,
      source: template.source,
      code: code,
    }, id);

    if (result.success) {
      toast({ title: 'Content Saved', description: 'The template content has been updated.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };
  
  const handleRefine = async () => {
    if (!refinePrompt) {
        toast({ variant: 'destructive', title: 'Prompt is required for refinement.' });
        return;
    }
    setIsRefining(true);
    toast({ title: 'AI is refining your code...' });
    try {
        const result = await refineCode({ code, prompt: refinePrompt });
        setCode(result.code);
        toast({ title: 'Code Refined!', description: 'The AI has updated the code based on your prompt.' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Refinement Failed', description: e.message });
    } finally {
        setIsRefining(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
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

  return (
    <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="content-code">
                {template?.method === 'codebase' ? 'Component JSON' : 'Template Code'}
              </Label>
              <Textarea
                id="content-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder={template?.method === 'codebase' ? '[ { "id": "el-1", ... } ]' : 'Enter your HTML or template string here.'}
              />
               <p className="text-xs text-muted-foreground">
                {template?.method === 'textual' && "Use {{item.field_name}} for dynamic data."}
              </p>
            </div>
          </CardContent>
          <CardFooter>
             <Button onClick={handleSave} disabled={isSaving || isRefining}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Content
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    <Label htmlFor="refine-prompt">Refine with AI</Label>
                </div>
                <Textarea
                    id="refine-prompt"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="e.g., 'Make all the text larger and change the button color to blue.'"
                    rows={3}
                />
            </CardContent>
            <CardFooter>
                 <Button onClick={handleRefine} disabled={isSaving || isRefining} variant="outline">
                    {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Refine
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
