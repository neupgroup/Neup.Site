
'use client';

import { useState, useEffect } from 'react';
import { getSite } from '@/actions/editor/site';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Link as LinkIcon, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPath, getPathForPage } from '@/actions/paths';
import { useToast } from '@/hooks/use-toast';

export default function ViewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const [srcDoc, setSrcDoc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState('');
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [initialPath, setInitialPath] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPageAndPath = async () => {
      setLoading(true);
      
      const siteResult = await getSite(id);
      if (siteResult.success && siteResult.site) {
        setSrcDoc(`/preview/${id}`);
      } else {
        setError(siteResult.error || 'Failed to load page content.');
      }

      const pathResult = await getPathForPage(id);
      if (pathResult.success && pathResult.path) {
          setPath(pathResult.path.path);
          setInitialPath(pathResult.path.path);
      }
      
      setLoading(false);
    };

    fetchPageAndPath();
  }, [id]);

  const handleSavePath = async () => {
    setIsSavingPath(true);
    let finalPath = path.trim();
    if (!finalPath.startsWith('/')) {
        finalPath = `/${finalPath}`;
    }

    const result = await createPath(finalPath, id);
    if(result.success) {
        setInitialPath(finalPath);
        toast({ title: 'Path Saved!', description: `Page is now accessible at ${finalPath}`});
    } else {
        toast({ variant: 'destructive', title: 'Error Saving Path', description: result.error });
    }

    setIsSavingPath(false);
  }

  return (
    <div className="flex flex-col h-full space-y-4">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Viewing Page</CardTitle>
                <CardDescription>Preview for page ID: {id}</CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/site/pages"><ArrowLeft className="mr-2 h-4 w-4" />Back to Pages</Link>
            </Button>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="path">Public URL Path</Label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/e.g-about-us" className="pl-10" />
                        </div>
                        <Button onClick={handleSavePath} disabled={isSavingPath || path === initialPath}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSavingPath ? 'Saving...' : 'Save Path'}
                        </Button>
                    </div>
                    {initialPath && <p className="text-sm text-muted-foreground">This page is live at: <Link href={initialPath} target="_blank" className="text-primary underline">{initialPath}</Link></p>}
                 </div>

                 {loading && (
                    <div className="w-full h-[60vh] flex items-center justify-center">
                        <Skeleton className="w-full h-full" />
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!loading && !error && srcDoc && (
                    <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
                        <iframe
                            src={srcDoc}
                            title={`Preview of page ${id}`}
                            className="w-full h-full"
                            sandbox="allow-scripts allow-same-origin" // Security precaution
                        />
                    </div>
                )}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
