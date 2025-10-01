
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTemplate, saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Template } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Save } from 'lucide-react';

export default function EditTemplateContentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [code, setCode] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);


  useEffect(() => {
    if (!id) return;
    
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const templateResult = await getTemplate(id);
        
        if (templateResult.success && templateResult.template) {
          const { template } = templateResult;
          setOriginalTemplate(template);
          setCode(template.code || '');
        } else {
          setError(templateResult.error || 'Failed to fetch template');
        }
      } catch (e: any) {
        setError("An unexpected error occurred while fetching data.");
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [id, toast]);
  
  const handleSaveChanges = async () => {
      if (!id || !originalTemplate) return;
      setIsSaving(true);
      
      const updatedTemplateData: Omit<Template, 'id' | 'createdAt'> = {
          ...originalTemplate,
          code,
      };

      const result = await saveTemplate(updatedTemplateData, id);

      if (result.success) {
          toast({ title: 'Success', description: 'Template content saved successfully.'});
          router.push(`/root/templates/${id}`);
          router.refresh();
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsSaving(false);
  }

  const getCodePlaceholder = () => {
      if (!originalTemplate) return '';
      switch(originalTemplate.method) {
          case 'codebase':
              return 'Enter HTML, JSON, or JSX...';
          case 'textual':
              return 'Describe the component you want to create. e.g., "A hero section with a title, subtitle, and a call-to-action button."';
          case 'dragger':
              return 'Template will be created from the dragger. (This method is not yet implemented).';
          default:
              return '';
      }
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </CardContent>
        </Card>
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
  
  if (!originalTemplate) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Could not load the template to edit.</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Step 2: Content Definition</CardTitle>
        <CardDescription>Define the content for your template using the <span className="font-bold">{originalTemplate.method}</span> method.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="space-y-2">
          <Label htmlFor="code">Content</Label>
          <Textarea 
            id="code" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
            rows={15} 
            className="font-mono text-xs bg-muted/50"
            placeholder={getCodePlaceholder()}
            disabled={originalTemplate.method === 'dragger'}
          />
        </div>
      </CardContent>
       <CardFooter className="flex justify-end">
         <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Template'}
         </Button>
      </CardFooter>
    </Card>
  );
}
