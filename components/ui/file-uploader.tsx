
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/core/hooks/use-toast';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, File as FileIcon } from 'lucide-react';
import { cn } from '@/core/utils';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/inapp/context/ProfileContext';
import Image from 'next/image';
import { isResolvedAssetLogoSvg, resolveAssetLogoUrl } from '@/inapp/helpers/asset/logo';

interface FileUploaderProps {
  uploadPath: string;
  acceptedFileTypes?: string;
  onUploadSuccess?: (url: string) => void;
  currentImageUrl?: string | null;
}

export function FileUploader({ uploadPath, acceptedFileTypes, onUploadSuccess, currentImageUrl }: FileUploaderProps) {
  const { asset } = useProfile();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const assetId = asset?.id;

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

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
    if (!file || !assetId) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file, uploadPath);
    formData.append('platform', 'neupsites');
    formData.append('contentIds', JSON.stringify([assetId]));

    const fileName = uploadPath.split('/').pop()?.split('.')[0] || 'file';
    formData.append('name', fileName);

    try {
      const response = await fetch('https://neupgroup.com/content/bridge/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.url) {
        setStatus('success');
        setPreviewUrl(result.url);
        setFile(null);
        toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.` });
        if (onUploadSuccess) onUploadSuccess(result.url);
      } else {
        throw new Error(result.message || 'The API returned an error.');
      }
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'An unknown error occurred');
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    }
  };
  
  const renderPreview = () => {
    if (previewUrl) {
      if (acceptedFileTypes?.startsWith('image/')) {
        const resolvedPreviewUrl = resolveAssetLogoUrl(previewUrl, asset?.theme);
        if (!resolvedPreviewUrl) {
          return <FileIcon className="h-8 w-8 text-muted-foreground" />;
        }

        return (
          <Image
            src={resolvedPreviewUrl}
            alt="Preview"
            width={48}
            height={48}
            unoptimized={isResolvedAssetLogoSvg(resolvedPreviewUrl)}
            className="object-contain"
          />
        );
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
          <Button variant="primary" onClick={handleUpload} disabled={status === 'uploading'} size="sm">
            {status === 'uploading' ? `Uploading...` : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
