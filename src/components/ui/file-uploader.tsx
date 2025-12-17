
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useProfile } from '@/context/ProfileContext';
import { initializeFirebase } from '@/lib/firebase';
import Image from 'next/image';

interface FileUploaderProps {
  uploadPath: string; // This will now be the path in Firebase Storage, e.g., '/logo.png'
  acceptedFileTypes?: string;
  onUploadSuccess?: (url: string) => void;
}

export function FileUploader({ uploadPath, acceptedFileTypes, onUploadSuccess }: FileUploaderProps) {
  const { site } = useProfile();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const siteId = site?.id;

  const fetchExistingFile = useCallback(async () => {
    if (!siteId) return;
    try {
        const { storage } = initializeFirebase();
        const storageRef = ref(storage, `uploads/${siteId}${uploadPath}`);
        const url = await getDownloadURL(storageRef);
        setPreviewUrl(url);
    } catch (e: any) {
        if (e.code !== 'storage/object-not-found') {
            console.warn(`Could not fetch existing file for ${uploadPath}:`, e.message);
        }
        setPreviewUrl(null);
    }
  }, [siteId, uploadPath]);

  useEffect(() => {
    fetchExistingFile();
  }, [fetchExistingFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setError(null);
      setPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? { [acceptedFileTypes]: [] } : undefined,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !siteId) return;

    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `uploads/${siteId}${uploadPath}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          throw error;
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setStatus('success');
          setPreviewUrl(downloadURL);
          setFile(null);
          toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.` });
          if (onUploadSuccess) onUploadSuccess(downloadURL);
        }
      );
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'An unknown error occurred');
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    }
  };
  
  const renderPreview = () => {
    if (previewUrl) {
      if (acceptedFileTypes?.startsWith('image/')) {
        return <Image src={previewUrl} alt="Preview" width={48} height={48} className="object-contain" />;
      }
      return <FileIcon className="h-8 w-8 text-muted-foreground" />;
    }
    return <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />;
  }

  return (
    <div className="space-y-4">
      <div {...getRootProps({ className: cn("p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors flex flex-col items-center justify-center", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50", file && "border-primary") })}>
        <input {...getInputProps()} />
        {renderPreview()}
        {file ? (
          <p className="text-xs font-medium truncate mt-2">{file.name}</p>
        ) : !previewUrl && (
          <p className="text-xs text-muted-foreground mt-2">{isDragActive ? "Drop the file here" : "Drag 'n' drop or click"}</p>
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
            {status === 'uploading' ? `Uploading ${Math.round(progress)}%` : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
