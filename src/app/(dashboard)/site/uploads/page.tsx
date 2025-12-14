
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  UploadCloud,
  FileText,
  Folder,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { getPublicFiles, uploadPublicFile, deletePublicFile, PublicFile } from '@/actions/uploads';
import { Input } from '@/components/ui/input';

interface UploadingFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function SiteUploadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPath = searchParams.get('path') || '/';
  const [pathInputValue, setPathInputValue] = useState(currentPath);

  const [files, setFiles] = useState<PublicFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    const result = await getPublicFiles(path);
    if (result.success && result.files) {
      setFiles(result.files);
    } else {
      setError(result.error || 'Failed to fetch files.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles(currentPath);
    setPathInputValue(currentPath);
  }, [currentPath, fetchFiles]);

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
    if (filesToUpload.length === 0) return;

    for (const fileToUpload of filesToUpload) {
      setUploadingFiles(prev => prev.map(f => f.file.name === fileToUpload.file.name ? { ...f, status: 'uploading' } : f));
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(fileToUpload.file);
        reader.onload = async (e) => {
            const content = (e.target?.result as string).split(',')[1];
            const result = await uploadPublicFile(currentPath, content, fileToUpload.file.name);
            
            if (result.success) {
                setUploadingFiles(prev => prev.map(f => f.file.name === fileToUpload.file.name ? { ...f, status: 'success' } : f));
            } else {
                 setUploadingFiles(prev => prev.map(f => f.file.name === fileToUpload.file.name ? { ...f, status: 'error', error: result.error } : f));
            }
        };
        reader.onerror = () => {
            setUploadingFiles(prev => prev.map(f => f.file.name === fileToUpload.file.name ? { ...f, status: 'error', error: 'Failed to read file.' } : f));
        }
      } catch (e: any) {
        setUploadingFiles(prev => prev.map(f => f.file.name === fileToUpload.file.name ? { ...f, status: 'error', error: e.message } : f));
      }
    }

    setTimeout(() => {
        setUploadingFiles([]);
        fetchFiles(currentPath);
    }, 2000);
  };

  const navigate = (newPath: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('path', newPath);
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const handlePathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPathInputValue(e.target.value);
  }

  const handlePathInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          navigate(pathInputValue);
      }
  };


  const goUp = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    navigate(parentPath);
  };
  
  const handleDelete = async (file: PublicFile) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${file.name}"?`);
    if (isConfirmed) {
      const result = await deletePublicFile(file.path);
      if (result.success) {
        toast({ title: 'Deleted', description: `${file.name} has been deleted.` });
        fetchFiles(currentPath);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    }
  };

  const formatFileSize = (sizeInBytes?: number) => {
    if (typeof sizeInBytes !== 'number') return 'N/A';
    if (sizeInBytes === 0) return '0 B';
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return `${parseFloat((sizeInBytes / Math.pow(1024, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB'][i]}`;
  };

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Uploads</h1>
        <p className="text-muted-foreground">Manage your site's public assets.</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Drag and drop files here to upload them to the current directory.</CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps({ className: cn("p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50") })}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>{isDragActive ? "Drop to upload" : "Drag 'n' drop files here, or click to select"}</p>
          </div>
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              {uploadingFiles.map((uf, index) => (
                <div key={index} className="flex items-center gap-4 p-2 border rounded-md">
                    {uf.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : uf.status === 'uploading' ? <Loader2 className="h-5 w-5 animate-spin" /> : uf.status === 'error' ? <AlertCircle className="h-5 w-5 text-destructive" /> : <FileText className="h-5 w-5" />}
                    <div className="flex-1 truncate">
                        <p className="text-sm font-medium">{uf.file.name}</p>
                        {uf.status === 'error' && <p className="text-xs text-destructive">{uf.error}</p>}
                    </div>
                </div>
              ))}
              <Button onClick={handleUpload} disabled={uploadingFiles.every(f => f.status !== 'pending')}>Upload Files</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
           <div className="flex items-center gap-2 pt-2">
                {currentPath !== '/' && <Button variant="ghost" size="icon" onClick={goUp} className="h-9 w-9"><ArrowLeft className="h-4 w-4"/></Button>}
                <Input
                    value={pathInputValue}
                    onChange={handlePathInputChange}
                    onKeyDown={handlePathInputSubmit}
                    className="font-mono"
                />
            </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : error ? (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Last Modified</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No files in this directory.</TableCell></TableRow>
                ) : (
                  files.map(file => (
                    <TableRow key={file.path}>
                      <TableCell>
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => file.type === 'directory' && navigate(file.path)}
                        >
                          {file.type === 'directory' ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{file.modified ? format(file.modified, 'PPp') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(file)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
