
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '#/components/ui/alert';
import { Skeleton } from '#/components/ui/skeleton';
import { UploadCloud, FileText, Folder, AlertCircle, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { cn } from '#/core/utils';
import { deletePublicFile, type PublicFile, getPublicFiles } from '@/services/uploads';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/components/ui/alert-dialog';
import { useProfile } from '@/inapp/context/ProfileContext';


interface UploadingFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const FileManager = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPath = searchParams.get('path') || '/';

  const [files, setFiles] = useState<PublicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<PublicFile | null>(null);
  const [pathInputValue, setPathInputValue] = useState(currentPath);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    const result = await getPublicFiles(path);
    if (result.success && result.files) {
      setFiles(result.files);
    } else {
      setError(result.error || 'Failed to list files.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles(currentPath);
    setPathInputValue(currentPath);
  }, [currentPath, fetchFiles]);

  const navigate = (newPath: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('path', newPath);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFileClick = (file: PublicFile) => {
    if (file.type === 'directory') {
      navigate(file.path);
    } else {
      // In a real app, you'd get the base URL from a config
      // For now, let's assume a placeholder.
      window.open(`/uploads-placeholder/${file.path}`, '_blank');
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(p => p);
    pathParts.pop();
    const newPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    navigate(newPath);
  };

  const handleDelete = async () => {
    if (!deletingFile) return;
    const result = await deletePublicFile(deletingFile.path);
    if (result.success) {
      toast({ title: 'Deleted', description: `${deletingFile.name} has been deleted.` });
      fetchFiles(currentPath); // Refresh list
    } else {
      toast({ variant: 'destructive', title: 'Error Deleting', description: result.error });
    }
    setDeletingFile(null);
  };

  const getFileIcon = (type: PublicFile['type']) => {
    switch (type) {
      case 'directory': return <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
      default: return <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <AlertDialog open={!!deletingFile} onOpenChange={(open) => !open && setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingFile?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CardHeader>
        <CardTitle>File Browser</CardTitle>
      </CardHeader>
      <CardContent>
        {/* File Browser UI will be implemented here */}
      </CardContent>
    </Card>
  );
}

export default function SiteUploadsPage() {
  const { toast } = useToast();
  const { asset } = useProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = searchParams.get('path') || '/';

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadPath, setUploadPath] = useState(currentPath);
  
  useEffect(() => {
    setUploadPath(currentPath);
  }, [currentPath]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
    }));
    setUploadingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: false });

  const handleUpload = async () => {
    const filesToUpload = uploadingFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0 || !asset?.id) return;

    setUploadingFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f));

    await Promise.all(filesToUpload.map(async (fileToUpload) => {
        const formData = new FormData();
        formData.append('file', fileToUpload.file);
        formData.append('platform', 'neupsites');
        formData.append('contentIds', JSON.stringify([asset.id]));

        try {
            const response = await fetch('https://neupgroup.com/api/v1/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setUploadingFiles(prev => prev.map(f =>
                    f.file === fileToUpload.file ? { ...f, status: 'success' } : f
                ));
            } else {
                throw new Error(result.message || 'API returned an error');
            }
        } catch (e: any) {
            setUploadingFiles(prev => prev.map(f =>
                f.file === fileToUpload.file ? { ...f, status: 'error', error: e.message } : f
            ));
        }
    }));
    
    setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.status === 'error'));
        const params = new URLSearchParams(searchParams);
        router.push(`${pathname}?${params.toString()}`);
    }, 2000);
  };

  const pendingCount = uploadingFiles.filter(f => f.status === 'pending').length;

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Uploads</h1>
        <p className="text-muted-foreground">Manage your asset's public assets with intelligent parallel uploads.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files or Folders</CardTitle>
          <CardDescription>
            Drag and drop your project folder or individual files here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps({ className: cn("p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50") })}>
            <input {...getInputProps(({ directory: "true", webkitdirectory: "true" } as any))} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>{isDragActive ? "Drop to upload" : "Drag 'n' drop files or a folder here, or click to select"}</p>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="upload-path">Upload Location</Label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm h-10">
                /content/neupsites/{asset?.id || '...'}/
              </span>
              <Input
                id="upload-path"
                value={uploadPath}
                onChange={(e) => setUploadPath(e.target.value)}
                placeholder="/"
                className="rounded-l-none"
              />
            </div>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              {uploadingFiles.map((uf, index) => (
                <div key={index} className="flex items-center gap-4 p-2 border rounded-md">
                  {uf.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : uf.status === 'uploading' ? <Loader2 className="h-5 w-5 animate-spin" /> : uf.status === 'error' ? <AlertCircle className="h-5 w-5 text-destructive" /> : <FileText className="h-5 w-5" />}
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{uf.file.webkitRelativePath || uf.file.name}</p>
                    {uf.status === 'error' && <p className="text-xs text-destructive">{uf.error}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(uf.file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              ))}
              {pendingCount > 0 && (
                <Button type="solid" onClick={handleUpload} disabled={uploadingFiles.some(f => f.status === 'uploading')}>
                  Upload {pendingCount} file(s)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FileManager />
    </div>
  );
}
