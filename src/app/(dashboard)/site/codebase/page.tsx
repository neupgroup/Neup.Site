
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, FileText, Trash2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { uploadCodeFile, getCodeFiles, deleteCodeFile } from '@/actions/codebase';
import type { CodeFile } from '@/schemas/codebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';
interface UploadingFile {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export default function CodebasePage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setUploadingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleUpload = async () => {
    const filesToUpload = uploadingFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    for (const fileToUpload of filesToUpload) {
      setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'uploading' } : f));

      try {
        const reader = new FileReader();
        reader.readAsDataURL(fileToUpload.file);
        reader.onload = async (e) => {
          const content = (e.target?.result as string).split(',')[1]; // Get base64 part
          const result = await uploadCodeFile({
            fileName: fileToUpload.file.name,
            filePath: fileToUpload.file.webkitRelativePath || fileToUpload.file.name,
            content,
            size: fileToUpload.file.size
          });

          if (result.success) {
            setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'success', progress: 100 } : f));
          } else {
            throw new Error(result.error);
          }
        };
        reader.onerror = (error) => {
          throw new Error('Failed to read file.');
        };
      } catch (e: any) {
        setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'error', error: e.message } : f));
      }
    }
    // After all uploads are initiated, refresh the file list
    setTimeout(() => {
        setUploadingFiles([]);
        fetchFiles();
    }, 2000);
  };
  
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
            <p className="text-muted-foreground">Upload your codebase files and manage deployments to your custom host.</p>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Upload Code Files</CardTitle>
          <CardDescription>Drag and drop your project folder or individual files here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}>
            <input {...getInputProps({ directory: "true", webkitdirectory: "true" })} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? <p>Drop the files here ...</p> : <p>Drag 'n' drop some files here, or click to select files</p>}
          </div>
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              {uploadingFiles.map((uf, index) => (
                <div key={index} className="flex items-center gap-4">
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{uf.file.name}</p>
                    <Progress value={uf.status === 'success' ? 100 : uf.status === 'uploading' ? 50 : 0} className="h-2" />
                  </div>
                  {uf.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin" />}
                  {uf.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" title={uf.error} />}
                </div>
              ))}
              <Button onClick={handleUpload} disabled={uploadingFiles.some(f => f.status === 'uploading')}>
                Upload {uploadingFiles.length} file(s)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
       <Card>
            <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                    {totalCount} files uploaded in total.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : error ? (
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription className="break-all">{error}</AlertDescription></Alert>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Path</TableHead>
                                    <TableHead>Size (KB)</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploadedFiles.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No files uploaded yet.</TableCell></TableRow>
                                ) : (
                                    uploadedFiles.map(file => (
                                        <TableRow key={file.id}>
                                            <TableCell className="font-mono text-xs max-w-sm whitespace-pre-wrap break-all">{file.filePath}</TableCell>
                                            <TableCell>{(file.size / 1024).toFixed(2)}</TableCell>
                                            <TableCell>{file.createdAt ? format(new Date(file.createdAt), 'PPpp') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    </div>
  );
}
