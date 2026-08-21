
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertCircle, Loader2, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { getCodeFiles, deleteCodeFile } from '@/services/codebase';
import { deployCodebaseFromStorage } from '@/services/deploy';
import type { CodeFile } from '@/services/codebase/type';
import { useToast } from '@/core/hooks/use-toast';
import { usePageTitle } from '@/core/hooks/use-page-title';

function getFolderLabel(filePath: string) {
  const segments = filePath.split('/').filter(Boolean);
  if (segments.length <= 1) return 'Root';
  return segments.slice(0, -1).join('/');
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CodebasePage() {
  usePageTitle('Codebase');
  const [uploadedFiles, setUploadedFiles] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = 10;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const result = await getCodeFiles({ page: currentPage, pageSize });
    if (result.success && result.files) {
      setUploadedFiles(result.files);
      setTotalCount(result.totalCount || 0);
    } else {
      setError(result.error || 'Failed to fetch files.');
    }
    setLoading(false);
  }, [currentPage]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  const handleDelete = async (id: string) => {
    const originalFiles = [...uploadedFiles];
    setUploadedFiles(files => files.filter(f => f.id !== id)); // Optimistic delete
    
    const result = await deleteCodeFile(id);
    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setUploadedFiles(originalFiles); // Revert on failure
    } else {
        toast({ title: 'File Deleted' });
        // Refetch to ensure count and page is correct
        fetchFiles();
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true);
    const result = await deployCodebaseFromStorage();
    if (result.success && result.logId) {
        toast({ title: 'Deployment Started', description: 'Check server logs for progress.'});
        router.push(`/root/servers/${result.serverId}`);
    } else {
        toast({ variant: 'destructive', title: 'Deployment Failed', description: result.error });
        setIsDeploying(false);
    }
  };

  const totalSize = useMemo(() => {
    // This only calculates size for the current page. A full calculation would require fetching all files.
    // For now, let's keep it simple or indicate it's for the current view.
    return uploadedFiles.reduce((acc, file) => acc + file.size, 0);
  }, [uploadedFiles]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Codebase</h1>
            <p className="text-muted-foreground">Manage deployments to your custom host and review uploaded codebase files.</p>
        </div>
         <Button variant="primary" onClick={handleDeploy} disabled={isDeploying || totalCount === 0}>
            {isDeploying ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2" />}
            {isDeploying ? 'Deploying...' : 'Deploy Assets'}
        </Button>
      </header>
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : error ? (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription className="break-all">{error}</AlertDescription></Alert>
      ) : (
        <div className="space-y-3">
          <Card className="w-full">
            <CardContent
              className="cursor-pointer p-5 transition-colors hover:bg-muted/40"
              onClick={() => router.push('/site/codebase/upload')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push('/site/codebase/upload');
                }
              }}
            >
              <p className="text-base font-semibold text-foreground">Upload Codefiles</p>
            </CardContent>
          </Card>
          {uploadedFiles.length > 0 && (
            uploadedFiles.map(file => (
              <Card key={file.id} className="w-full">
                <CardContent className="flex w-full items-start justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {getFolderLabel(file.filePath)}
                    </p>
                    <p className="break-all text-base font-semibold text-foreground">
                      {file.fileName || file.filePath.split('/').pop() || file.filePath}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="plain"
                    size="icon"
                    onClick={() => handleDelete(file.id)}
                    aria-label={`Delete ${file.fileName || file.filePath}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
