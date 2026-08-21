'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, AlertCircle, FileText, Loader2, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/core/hooks/use-toast';
import { usePageTitle } from '@/core/hooks/use-page-title';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface UploadingFile {
  file: File;
  status: UploadStatus;
  error?: string;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CodebaseUploadPage() {
  usePageTitle('Upload Codebase Files');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const currentPath = searchParams.get('path');
  const codebaseHref = currentPath ? `/site/codebase?path=${encodeURIComponent(currentPath)}` : '/site/codebase';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nextFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
    }));
    setUploadingFiles((current) => [...current, ...nextFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    const pendingFiles = uploadingFiles.filter((file) => file.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const pendingFile of pendingFiles) {
      setUploadingFiles((current) =>
        current.map((item) => (item.file === pendingFile.file ? { ...item, status: 'uploading' } : item)),
      );

      try {
        const content = await pendingFile.file.text();
        const filePath = pendingFile.file.webkitRelativePath || pendingFile.file.name;
        const response = await fetch(`/bridge/api.v1/codebase/upload?path=${encodeURIComponent(filePath)}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to upload file.');
        }

        setUploadingFiles((current) =>
          current.map((item) => (item.file === pendingFile.file ? { ...item, status: 'success', error: undefined } : item)),
        );
      } catch (error: any) {
        setUploadingFiles((current) =>
          current.map((item) =>
            item.file === pendingFile.file
              ? { ...item, status: 'error', error: error.message || 'Failed to upload file.' }
              : item,
          ),
        );
      }
    }

    setIsUploading(false);
    toast({ title: 'Upload complete' });
    router.push(codebaseHref);
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="tertiary" size="sm" onClick={() => router.push(codebaseHref)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Upload Codefiles</h1>
          <p className="text-muted-foreground">Upload files or an entire project folder into the codebase.</p>
        </div>
      </header>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>Drag and drop files here, or click to choose files and folders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'cursor-pointer hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} {...({ directory: 'true', webkitdirectory: 'true' } as any)} />
            <UploadCloud className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">
              {isDragActive ? 'Drop the files here' : 'Drag and drop files, or click to browse'}
            </p>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile) => (
                <div
                  key={`${uploadingFile.file.name}-${uploadingFile.file.lastModified}`}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {uploadingFile.status === 'uploading' ? (
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                    ) : uploadingFile.status === 'error' ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                    ) : (
                      <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium text-foreground">{uploadingFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(uploadingFile.file.size)}</p>
                      {uploadingFile.error && <p className="text-xs text-destructive">{uploadingFile.error}</p>}
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{uploadingFile.status}</p>
                </div>
              ))}

              <Button variant="primary" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload {uploadingFiles.length} file(s)
              </Button>
            </div>
          )}

          {uploadingFiles.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No files selected</AlertTitle>
              <AlertDescription>Add files or a folder to begin uploading.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
