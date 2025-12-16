'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, File as FileIcon } from 'lucide-react';
import { uploadPublicFile } from '@/actions/uploads';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploaderProps {
  uploadPath: string;
  acceptedFileTypes?: string;
}

export function FileUploader({ uploadPath, acceptedFileTypes }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? { [acceptedFileTypes]: [] } : undefined,
    multiple: false,
  });

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      const content = await readFileAsBase64(file);
      const result = await uploadPublicFile(uploadPath, content);
      
      if (result.success) {
        setStatus('success');
        toast({ title: 'Upload Successful', description: `${file.name} uploaded to ${uploadPath}` });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'An unknown error occurred');
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    }
  };

  return (
    <div className="space-y-4">
      <div {...getRootProps({ className: cn("p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50", file && "border-primary") })}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium truncate">{file.name}</p>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{isDragActive ? "Drop the file here" : "Drag 'n' drop or click"}</p>
          </>
        )}
      </div>
      {file && (
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
            {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
            <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
          </div>
          <Button onClick={handleUpload} disabled={status === 'uploading'} size="sm">
            {status === 'uploading' ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
