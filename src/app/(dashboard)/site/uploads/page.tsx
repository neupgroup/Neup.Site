
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { uploadPublicFile, type PublicFile } from '@/actions/uploads';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadPath, setUploadPath] = useState('');

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
            const result = await uploadPublicFile(uploadPath, content, fileToUpload.file.name);
            
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
        toast({ title: 'Uploads Finished', description: 'Files have been processed.'});
        // We no longer have a file list on this page, so no need to refetch
    }, 2000);
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
          <CardDescription>Drag and drop files here to upload them to your public directory.</CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps({ className: cn("p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50") })}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>{isDragActive ? "Drop to upload" : "Drag 'n' drop files here, or click to select"}</p>
          </div>
          
           <div className="mt-4 space-y-2">
              <Label htmlFor="upload-path">Location</Label>
              <div className="flex items-center">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm h-10">
                      /public/
                  </span>
                  <Input
                      id="upload-path"
                      value={uploadPath}
                      onChange={(e) => setUploadPath(e.target.value)}
                      placeholder="e.g., assets/images"
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
                        <p className="text-sm font-medium">{uf.file.name}</p>
                        {uf.status === 'error' && <p className="text-xs text-destructive">{uf.error}</p>}
                    </div>
                </div>
              ))}
              <Button onClick={handleUpload} disabled={uploadingFiles.some(f => f.status === 'uploading')}>
                Upload {uploadingFiles.filter(f => f.status === 'pending').length} file(s)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
