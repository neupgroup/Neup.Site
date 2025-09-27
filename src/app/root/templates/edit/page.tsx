'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTemplate, saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Template } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AiPrompt from '@/components/editor/ai-prompt';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [elementsJson, setElementsJson] = useState('');
  const [type, setType] = useState<'section' | 'page' | 'element'>('section');
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);


  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        const { template } = result;
        setOriginalTemplate(template);
        setName(template.name);
        setDescription(template.description || '');
        setElementsJson(JSON.stringify(template.elements, null, 2));
        setType(template.type);
      } else {
        setError(result.error || 'Failed to fetch template');
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [id]);
  
  const handleSaveChanges = async () => {
      if (!id || !originalTemplate) return;
      setIsSaving(true);
      
      let elements;
      try {
        elements = JSON.parse(elementsJson);
      } catch(e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The element structure is not valid JSON.' });
        setIsSaving(false);
        return;
      }

      const updatedTemplateData = {
          ...originalTemplate,
          name,
          description,
          type,
          elements
      };

      const result = await saveTemplate(updatedTemplateData, id);

      if (result.success) {
          toast({ title: 'Success', description: 'Template updated successfully.'});
          router.push(`/root/templates/${id}`);
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsSaving(false);
  }
  
  const handleAiGeneration = (generatedJson: string) => {
      // In the edit screen, we don't automatically apply the change
      // to prevent accidental overwrites. The user can copy-paste.
      toast({ title: 'Generated JSON', description: 'Copy the generated JSON below and paste it into the structure field if you wish to use it.' });
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
    <div className="w-full max-w-2xl space-y-6">
        <AiPrompt onGenerate={handleAiGeneration} />
        <Card>
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
                <Label>Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template type" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="element">Element</SelectItem>
                  </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="elementsJson">Elements (JSON)</Label>
              <Textarea id="elementsJson" value={elementsJson} onChange={e => setElementsJson(e.target.value)} rows={15} className="font-mono text-xs bg-muted/50" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
             <Button variant="ghost" asChild>
                <Link href="/root/templates"><ArrowLeft className="mr-2 h-4 w-4" />Back to Templates</Link>
             </Button>
             <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
             </Button>
          </CardFooter>
        </Card>
    </div>
  );
}
