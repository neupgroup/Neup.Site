'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTemplate } from '@/actions/editor/templates';
import type { Template, CanvasElementData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Pencil } from 'lucide-react';
import Canvas from '@/components/editor/canvas';


const emptyFn = () => {};

export default function TemplateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        setTemplate(result.template);
      } else {
        setError(result.error || 'Failed to fetch template');
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [id]);
  
  if (loading) {
    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Skeleton className="h-10 w-32" />
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
      return (
        <Alert>
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>This template could not be found.</AlertDescription>
        </Alert>
      )
  }

  return (
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{template.description || 'No description'}</CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="mb-4 text-lg font-semibold">Preview</h3>
            <div className="rounded-lg border bg-background p-4 relative overflow-auto pointer-events-none">
                <Canvas
                    elements={template.elements as CanvasElementData[]}
                    selectedElement={null}
                    onSelectElement={emptyFn}
                    updateElement={emptyFn}
                    moveElement={emptyFn}
                    addElement={emptyFn}
                    addGeneratedElement={emptyFn}
                />
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" asChild>
                <Link href="/root/templates"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Templates</Link>
            </Button>
            <Button asChild>
                <Link href={`/root/templates/${id}/edit`}><Pencil className="mr-2 h-4 w-4"/>Edit</Link>
            </Button>
        </CardFooter>
    </Card>
  );
}
