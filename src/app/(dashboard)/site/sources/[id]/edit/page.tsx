
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditSourcePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sourceName, setSourceName] = useState('');
  const [sourceBasePath, setSourceBasePath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        setSource(result.source);
        setSourceName(result.source.name);
        setSourceBasePath(result.source.basePath);
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id]);

  const handleUpdateSource = async () => {
    if (!sourceName || !sourceBasePath) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a name and a base path.' });
      return;
    }
    setIsSaving(true);
    
    const result = await updateSource(id, { name: sourceName, basePath: sourceBasePath });

    if (result.success) {
      toast({ title: 'Source Updated!', description: `Successfully updated ${sourceName}.` });
      router.push(`/site/sources/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
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
    <div className="w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Data Source</CardTitle>
          <CardDescription>Update the details for your data source.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-name">Source Name</Label>
            <Input id="source-name" value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="e.g., My CRM API" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-path">Base Path</Label>
            <Input id="base-path" value={sourceBasePath} onChange={e => setSourceBasePath(e.target.value)} placeholder="https://api.example.com/v1" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/site/sources/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button onClick={handleUpdateSource} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
