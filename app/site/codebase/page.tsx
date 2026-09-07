'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Loader2,
  Rocket,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Skeleton } from '#/components/ui/skeleton';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { useToast } from '#/core/hooks/useToast';
import { createCodeFolder, deleteCodeFile, getCodebaseBrowser } from '@/services/codebase';
import { deployCodebaseFromStorage } from '@/services/deploy';
import type { CodebaseBrowserData, CodebaseBreadcrumb, CodebaseDirectoryEntry, CodebaseFileEntry } from '@/services/codebase/type';

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCurrentPath(path: string | null) {
  return path ? `/${path}` : '/';
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
            {index > 0 ? <ChevronRight className="h-4 w-4" /> : null}
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

function DirectoryCard({
  directory,
  isFirst,
  isLast,
  onOpen,
}: {
  directory: CodebaseDirectoryEntry;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (path: string) => void;
}) {
  return (
    <Card
      className={[
        'w-full cursor-pointer border-border/70 shadow-none transition hover:bg-muted/30',
        isFirst ? 'rounded-t-md' : 'rounded-t-none',
        isLast ? 'rounded-b-md' : 'rounded-b-none border-b-0',
      ].join(' ')}
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
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="break-all text-base font-semibold text-foreground">{directory.name}</p>
            <p className="text-sm text-muted-foreground">
              {directory.fileCount} file{directory.fileCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function FileCard({
  file,
  isFirst,
  isLast,
  onOpen,
  onDelete,
}: {
  file: CodebaseFileEntry;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (path: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      className={[
        'w-full cursor-pointer border-border/70 shadow-none transition hover:bg-muted/30',
        isFirst ? 'rounded-t-md' : 'rounded-t-none',
        isLast ? 'rounded-b-md' : 'rounded-b-none border-b-0',
      ].join(' ')}
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
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="break-all text-base font-semibold text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="plain"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(file.id);
            }}
            aria-label={`Delete ${file.name}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function UploadCard({
  href,
  isFirst,
  isLast,
}: {
  href: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'block w-full rounded-lg border border-border/70 bg-card text-card-foreground shadow-none transition hover:bg-muted/30',
        isFirst ? 'rounded-t-md' : 'rounded-t-none',
        isLast ? 'rounded-b-md' : 'rounded-b-none border-b-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-semibold text-foreground">Upload Files</p>
            <p className="text-sm text-muted-foreground">Add files or an entire folder to this codebase.</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

function NewFolderCard({
  isFirst,
  isLast,
  onClick,
}: {
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'block w-full rounded-lg border border-border/70 bg-card text-left text-card-foreground shadow-none transition hover:bg-muted/30',
        isFirst ? 'rounded-t-md' : 'rounded-t-none',
        isLast ? 'rounded-b-md' : 'rounded-b-none border-b-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
            <FolderPlus className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-semibold text-foreground">New Folder</p>
            <p className="text-sm text-muted-foreground">Create an empty folder in this location.</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </button>
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
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Folder name required', description: 'Enter a folder name to continue.' });
      return;
    }

    if (trimmedName.includes('/')) {
      toast({ variant: 'destructive', title: 'Invalid folder name', description: 'Use a single folder name without slashes.' });
      return;
    }

    const nextFolderPath = currentPath ? `${currentPath}/${trimmedName}` : trimmedName;

    setIsCreatingFolder(true);
    const result = await createCodeFolder(nextFolderPath);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Folder creation failed', description: result.error });
      setIsCreatingFolder(false);
      return;
    }

    toast({ title: 'Folder created' });
    setNewFolderName('');
    setIsCreateFolderDialogOpen(false);
    setIsCreatingFolder(false);
    await fetchCodebase();
  };

  const uploadHref = currentPath ? `/site/codebase/upload?path=${encodeURIComponent(currentPath)}` : '/site/codebase/upload';
  const selectedFile = browserData?.selectedFile;
  const directories = browserData?.directories ?? [];
  const files = browserData?.files ?? [];
  const breadcrumbs = browserData?.breadcrumbs ?? [{ name: 'Codebase', path: null }];
  const currentLocation = formatCurrentPath(browserData?.currentPath ?? currentPath);

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Codebase</h1>
          <p className="text-muted-foreground">Browse folders, open files, and edit. Currently at {currentLocation}</p>
          <Breadcrumbs breadcrumbs={breadcrumbs} onOpen={navigateToPath} />
        </div>
        <Button variant="solid" onClick={handleDeploy} disabled={isDeploying || !browserData?.totalFileCount}>
          {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          {isDeploying ? 'Deploying...' : 'Deploy Assets'}
        </Button>
      </header>

      {loading ? (
        <div className="space-y-0">
          <Skeleton className="h-20 w-full rounded-b-none" />
          <Skeleton className="h-20 w-full rounded-none" />
          <Skeleton className="h-20 w-full rounded-t-none" />
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
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="space-y-0">
              <UploadCard href={uploadHref} isFirst={true} isLast={false} />
              <NewFolderCard
                isFirst={false}
                isLast={directories.length === 0 && files.length === 0}
                onClick={() => setIsCreateFolderDialogOpen(true)}
              />
              {directories.map((directory, index) => (
                <DirectoryCard
                  key={directory.path}
                  directory={directory}
                  isFirst={false}
                  isLast={files.length === 0 && index === directories.length - 1}
                  onOpen={navigateToPath}
                />
              ))}
              {files.map((file, index) => (
                <FileCard
                  key={file.id}
                  file={file}
                  isFirst={false}
                  isLast={index === files.length - 1}
                  onOpen={navigateToPath}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      <Dialog
        open={isCreateFolderDialogOpen}
        onOpenChange={(open) => {
          setIsCreateFolderDialogOpen(open);
          if (!open) {
            setNewFolderName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Enter the name for the new folder in this location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="components"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isCreatingFolder) {
                  event.preventDefault();
                  handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outlined"
              onClick={() => {
                setIsCreateFolderDialogOpen(false);
                setNewFolderName('');
              }}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button variant="tinted" onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
