
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '#/core/hooks/useToast';
import { getRedirects, deleteRedirect, deployRedirects } from '@/services/redirects';
import type { Redirect } from '@/services/redirect/type';

import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Redo, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { Badge } from '#/components/ui/badge';
import { format } from 'date-fns';
import { CardFooter } from '#/components/ui/card';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function RedirectsPage() {
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  usePageTitle('Redirects');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = 10;
  
  const [isPending, startTransition] = useTransition();
  const [isDeploying, setIsDeploying] = useTransition();


  useEffect(() => {
    startTransition(async () => {
        setLoading(true);
        const result = await getRedirects({ page: currentPage, pageSize });
        if (result.success && result.redirects) {
            setRedirects(result.redirects);
            setTotalCount(result.totalCount || 0);
        } else {
            setError(result.error || 'Failed to fetch redirects');
        }
        setLoading(false);
    });
  }, [currentPage, pageSize]);
  
  const handleDelete = async (id: string) => {
    const originalRedirects = [...redirects];
    setRedirects(prev => prev.filter(r => r.id !== id));
    
    const result = await deleteRedirect(id);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setRedirects(originalRedirects);
    } else {
      toast({ title: 'Redirect Deleted' });
      // Re-fetch to ensure pagination is correct
      startTransition(() => {
        getRedirects({ page: currentPage, pageSize }).then(res => {
          if (res.success && res.redirects) {
            setRedirects(res.redirects);
            setTotalCount(res.totalCount || 0);
          }
        })
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleUpdateOnServer = () => {
    setIsDeploying(async () => {
        const result = await deployRedirects();
        if (result.success) {
            toast({ title: 'Redirects Updated', description: 'Redirects have been successfully deployed to the server.' });
        } else {
            toast({ variant: 'destructive', title: 'Deployment Failed', description: result.error || 'Failed to deploy redirects.' });
        }
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);


  return (
    <div className="w-full space-y-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Redirects</h1>
            <p className="text-muted-foreground">Create and manage URL redirects for your site.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outlined" onClick={handleUpdateOnServer} disabled={isDeploying}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isDeploying ? 'Updating...' : 'Update on Server'}
            </Button>
            <LinkButton variant="solid" href="/manage/redirects/create">
                    <Plus className="mr-2 h-4 w-4" /> Create Redirect
                </LinkButton>
        </div>
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
                         <Button variant="plain" size="icon" onClick={() => handleDelete(redirect.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))
        )}
      </div>

       {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between px-0">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isPending}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isPending}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        )}
    </div>
  );
}
