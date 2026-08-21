'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Rocket,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/core/hooks/use-page-title';
import { useToast } from '@/core/hooks/use-toast';
import { deleteCodeFile, getCodebaseBrowser } from '@/services/codebase';
import { deployCodebaseFromStorage } from '@/services/deploy';
import type { CodebaseBrowserData, CodebaseBreadcrumb, CodebaseDirectoryEntry, CodebaseFileEntry } from '@/services/codebase/type';

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatPathLabel(path: string | null) {
  return path ? `/${path}` : 'All folders and files';
}

function DirectoryCard({
  directory,
  onOpen,
}: {
  directory: CodebaseDirectoryEntry;
  onOpen: (path: string) => void;
}) {
  return (
    <Card
      className="h-full cursor-pointer border-border/70 transition hover:border-primary/40 hover:bg-muted/30"
      onClick={() => onOpen(directory.path)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(directory.path);
        }
      }}
    >
      <CardContent className="flex min-h-[180px] flex-col justify-between gap-6 p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <Folder className="h-8 w-8 text-primary" />
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {directory.fileCount} file{directory.fileCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-2">
            <p className="break-all text-lg font-semibold text-foreground">{directory.name}</p>
            <p className="text-sm text-muted-foreground">Open folder contents</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatFileSize(directory.totalSize)}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function FileCard({
  file,
  onOpen,
  onDelete,
}: {
  file: CodebaseFileEntry;
  onOpen: (path: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      className="h-full cursor-pointer border-border/70 transition hover:border-primary/40 hover:bg-muted/30"
      onClick={() => onOpen(file.path)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(file.path);
        }
      }}
    >
      <CardContent className="flex min-h-[180px] flex-col justify-between gap-6 p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <Button
              variant="plain"
              size="icon"
              className="-mr-2 -mt-2"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(file.id);
              }}
              aria-label={`Delete ${file.name}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="space-y-2">
            <p className="break-all text-lg font-semibold text-foreground">{file.name}</p>
            <p className="break-all text-sm text-muted-foreground">{file.path}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{formatFileSize(file.size)}</div>
      </CardContent>
    </Card>
  );
}

function Breadcrumbs({
  breadcrumbs,
  onOpen,
}: {
  breadcrumbs: CodebaseBreadcrumb[];
  onOpen: (path: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={breadcrumb.path ?? 'codebase-root'} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <button
              type="button"
              onClick={() => onOpen(breadcrumb.path)}
              disabled={isLast}
              className={isLast ? 'font-medium text-foreground' : 'transition hover:text-foreground'}
            >
              {breadcrumb.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function CodebasePage() {
  usePageTitle('Codebase');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [browserData, setBrowserData] = useState<CodebaseBrowserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPath = searchParams.get('path');

  const navigateToPath = useCallback(
    (nextPath: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPath) {
        params.set('path', nextPath);
      } else {
        params.delete('path');
      }

      const query = params.toString();
      router.push(query ? `/site/codebase?${query}` : '/site/codebase');
    },
    [router, searchParams],
  );

  const fetchCodebase = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getCodebaseBrowser(currentPath);
    if (!result.success || !result.data) {
      setBrowserData(null);
      setError(result.error || 'Failed to load codebase.');
      setLoading(false);
      return;
    }

    setBrowserData(result.data);
    setLoading(false);
  }, [currentPath]);

  useEffect(() => {
    fetchCodebase();
  }, [fetchCodebase]);

  const handleDelete = async (id: string) => {
    const result = await deleteCodeFile(id);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
      return;
    }

    toast({ title: 'File deleted' });

    if (browserData?.selectedFile?.id === id) {
      navigateToPath(browserData.parentPath);
      return;
    }

    fetchCodebase();
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    const result = await deployCodebaseFromStorage();

    if (result.success && result.logId) {
      toast({ title: 'Deployment started', description: 'Check server logs for progress.' });
      router.push(`/root/servers/${result.serverId}`);
      return;
    }

    toast({ variant: 'destructive', title: 'Deployment failed', description: result.error });
    setIsDeploying(false);
  };

  const uploadHref = currentPath ? `/site/codebase/upload?path=${encodeURIComponent(currentPath)}` : '/site/codebase/upload';
  const selectedFile = browserData?.selectedFile;
  const directories = browserData?.directories ?? [];
  const files = browserData?.files ?? [];
  const hasEntries = directories.length > 0 || files.length > 0;

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Codebase</h1>
          <p className="text-muted-foreground">Browse folders, open files, and deploy the current codebase.</p>
        </div>
        <Button variant="primary" onClick={handleDeploy} disabled={isDeploying || !browserData?.totalFileCount}>
          {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          {isDeploying ? 'Deploying...' : 'Deploy Assets'}
        </Button>
      </header>

      <Card className="border-border/70">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Breadcrumbs breadcrumbs={browserData?.breadcrumbs ?? [{ name: 'Codebase', path: null }]} onOpen={navigateToPath} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>{formatPathLabel(browserData?.currentPath ?? null)}</span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push(uploadHref)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Codefiles
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="break-all">{error}</AlertDescription>
        </Alert>
      ) : selectedFile ? (
        <div className="space-y-4">
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="break-all text-xl">{selectedFile.name}</CardTitle>
                <CardDescription className="break-all">{selectedFile.path}</CardDescription>
              </div>
              <Button variant="plain" size="icon" onClick={() => handleDelete(selectedFile.id)} aria-label={`Delete ${selectedFile.name}`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
              <div className="overflow-hidden rounded-lg border bg-muted/20">
                <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">{selectedFile.content}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : hasEntries ? (
        <div className="space-y-6">
          {directories.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Folders</h2>
                <p className="text-sm text-muted-foreground">Open a folder to view what is inside it.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {directories.map((directory) => (
                  <DirectoryCard key={directory.path} directory={directory} onOpen={navigateToPath} />
                ))}
              </div>
            </section>
          )}

          {files.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Files</h2>
                <p className="text-sm text-muted-foreground">Open a file to inspect its contents.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} onOpen={navigateToPath} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <Card className="border-border/70">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">This folder is empty</p>
              <p className="text-sm text-muted-foreground">Upload files or open a different path.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push(uploadHref)}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Codefiles
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
