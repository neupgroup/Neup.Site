
'use client';

import { useState, useEffect, use } from 'react';
import { getPage, savePage } from '@/server/editor/pages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default function CoderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPageCode = async () => {
      setLoading(true);
      const result = await getPage(id);
      if (result.success && result.page) {
        setCode(result.page.reactComponent || '');
      } else {
        setError(result.error || 'Failed to fetch page code.');
      }
      setLoading(false);
    };
    fetchPageCode();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await savePage(id, { reactComponent: code });
    if (result.success) {
      toast({ title: 'Code Saved', description: 'Your React component has been updated.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[60vh] w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-4xl">
        <Button asChild variant="ghost" className="mb-4">
            <Link href={`/site/pages/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit Options
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>
                    Directly edit the React/JSX component for this page. The root component should accept a prop named `items`.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-[60vh] font-mono text-sm"
                    placeholder="export default function MyPageComponent({ items }) { ... }"
                />
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Code
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
