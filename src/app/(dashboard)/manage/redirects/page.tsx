
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getRedirects, deleteRedirect, type Redirect } from '@/actions/redirects';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Redo, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function RedirectsPage() {
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRedirects = async () => {
    setLoading(true);
    const result = await getRedirects();
    if (result.success && result.redirects) {
      setRedirects(result.redirects);
    } else {
      setError(result.error || 'Failed to fetch redirects');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRedirects();
  }, []);
  
  const handleDelete = async (id: string) => {
    const originalRedirects = [...redirects];
    setRedirects(prev => prev.filter(r => r.id !== id));
    
    const result = await deleteRedirect(id);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setRedirects(originalRedirects);
    } else {
      toast({ title: 'Redirect Deleted' });
    }
  }

  return (
    <div className="w-full space-y-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Redirects</h1>
            <p className="text-muted-foreground">Create and manage URL redirects for your site.</p>
        </div>
        <Button asChild>
            <Link href="/manage/redirects/create">
                <Plus className="mr-2 h-4 w-4" /> Create Redirect
            </Link>
        </Button>
      </header>
      
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : error ? (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        ) : redirects.length === 0 ? (
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Redo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>No redirects created yet.</p>
          </div>
        ) : (
            redirects.map((redirect) => (
                <div key={redirect.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate" title={redirect.from}>{redirect.from}</p>
                        <p className="font-mono text-xs text-muted-foreground truncate" title={redirect.to}>&rarr; {redirect.to}</p>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                        <Badge variant={redirect.type === 'permanent' ? 'default' : 'secondary'}>{redirect.type === 'permanent' ? '301' : '302'}</Badge>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(redirect.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
