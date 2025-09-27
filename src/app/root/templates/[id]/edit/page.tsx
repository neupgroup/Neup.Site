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

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        setTemplate(result.template);
        setName(result.template.name);
        setDescription(result.template.description || '');
      } else {
        setError(result.error || 'Failed to fetch template');
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [id]);
  
  const handleSaveChanges = async () => {
      if (!template) return;
      setIsSaving(true);
      
      const updatedTemplateData: Partial<Template> = {
          name,
          description,
      };

      const result = await saveTemplate(updatedTemplateData, template.id);

      if (result.success) {
          toast({ title: 'Success', description: 'Template updated successfully.'});
          router.push(`/root/templates/${template.id}`);
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

  if (!template) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Template</CardTitle>
        <CardDescription>Editing template: {template.name}</CardDescription>
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
  );
}
