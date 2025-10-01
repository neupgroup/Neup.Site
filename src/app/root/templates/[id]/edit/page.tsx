
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTemplate, saveTemplate } from '@/actions/editor/templates';
import { getSources, type Source } from '@/actions/editor/sources';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Template } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_SOURCE_VALUE = '--none--';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'codebase' | 'textual' | 'dragger'>('codebase');
  const [sourceId, setSourceId] = useState(NO_SOURCE_VALUE);
  const [code, setCode] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);


  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [templateResult, sourcesResult] = await Promise.all([
          getTemplate(id),
          getSources()
        ]);
        
        if (templateResult.success && templateResult.template) {
          const { template } = templateResult;
          setOriginalTemplate(template);
          setName(template.name);
          setDescription(template.description || '');
          setMethod(template.method || 'codebase');
          setSourceId(template.source || NO_SOURCE_VALUE);
          setCode(template.code || '');
        } else {
          setError(templateResult.error || 'Failed to fetch template');
        }

        if (sourcesResult.success && sourcesResult.sources) {
            setSources(sourcesResult.sources);
        } else {
            // Non-fatal, user just can't select a source
            toast({ variant: 'destructive', title: 'Could not load sources', description: sourcesResult.error });
        }
      } catch (e: any) {
        setError("An unexpected error occurred while fetching data.");
      }
      setLoading(false);
    };

    fetchData();
  }, [id, toast]);
  
  const handleSaveChanges = async () => {
      if (!id || !originalTemplate) return;
      setIsSaving(true);
      
      const updatedTemplateData: Omit<Template, 'id' | 'createdAt'> = {
          name,
          description,
          method,
          source: sourceId === NO_SOURCE_VALUE ? '' : sourceId,
          code,
          type: originalTemplate.type, // Preserve original type
          elements: originalTemplate.elements, // Preserve original elements for now
      };

      const result = await saveTemplate(updatedTemplateData, id);

      if (result.success) {
          toast({ title: 'Success', description: 'Template updated successfully.'});
          router.push(`/root/templates/${id}`);
          router.refresh();
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsSaving(false);
  }


  if (loading) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Skeleton className="h-10 w-24" />
            </CardFooter>
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Template</CardTitle>
        <CardDescription>Editing template: {name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(value: any) => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a creation method" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="codebase">Codebase (HTML, JSON)</SelectItem>
                <SelectItem value="textual">Textual (AI)</SelectItem>
                <SelectItem value="dragger">Dragger</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>Data Source (Optional)</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SOURCE_VALUE}>None</SelectItem>
                {sources.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
         <div className="space-y-2">
          <Label htmlFor="code">Code (HTML, JSON, or prompt)</Label>
          <Textarea id="code" value={code} onChange={e => setCode(e.target.value)} rows={15} className="font-mono text-xs bg-muted/50" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
         <Button variant="ghost" asChild>
            <Link href="/root/templates"><ArrowLeft className="mr-2 h-4 w-4" />Back to Templates</Link>
         </Button>
         <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
         </Button>
      </CardFooter>
    </Card>
  );
}
