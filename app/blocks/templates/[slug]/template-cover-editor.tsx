'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, Loader2, Pencil, UploadCloud } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { useToast } from '@neup/core/hooks/useToast';
import { updateBlockTemplateCover } from '@/services/editor/block-templates';

export function TemplateCoverEditor({ id, initialUrl }: { id: string; initialUrl: string }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const router = useRouter();
  const { toast } = useToast();

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    const temporaryUrl = URL.createObjectURL(file);
    setPreviewUrl(temporaryUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', 'neupsites');
      formData.append('contentIds', JSON.stringify([id]));

      const response = await fetch('https://neupgroup.com/api/v1/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not upload the image.');

      const uploadedUrl = result.url || result.data?.url || result.file?.url || result.data?.file?.url;
      if (typeof uploadedUrl !== 'string' || !uploadedUrl) throw new Error('The upload completed, but no image URL was returned.');

      const saved = await updateBlockTemplateCover({ id, coverUrl: uploadedUrl });
      if (!saved.success) throw new Error(saved.error);

      setPreviewUrl(uploadedUrl);
      toast({ title: 'Cover image updated' });
      router.refresh();
    } catch (error) {
      setPreviewUrl(initialUrl);
      toast({
        variant: 'destructive',
        title: 'Could not update cover image',
        description: error instanceof Error ? error.message : 'Could not upload the image.',
      });
    } finally {
      URL.revokeObjectURL(temporaryUrl);
      setUploading(false);
    }
  }, [id, initialUrl, router, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: uploading,
    noClick: true,
  });

  return <div
    {...getRootProps({
      className: `group relative flex aspect-[16/7] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/60'} ${uploading ? 'cursor-wait' : ''}`,
      onClick: open,
    })}
    aria-label="Upload a cover image"
  >
    <input {...getInputProps()} />
    {previewUrl && <img src={previewUrl} alt="Template cover" className="absolute inset-0 h-full w-full object-cover" />}
    {(isDragActive || uploading) && <div className="absolute inset-0 bg-background/75" />}
    {previewUrl && !uploading && !isDragActive && <Button type="button" variant="secondary" size="sm" onClick={(event) => { event.stopPropagation(); open(); }} className="absolute right-3 top-3 z-20 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"><Pencil className="mr-2 h-4 w-4" />Edit</Button>}
    <div className="relative z-10 flex flex-col items-center gap-2 rounded-md bg-background/85 px-5 py-4 text-center shadow-sm">
      {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : previewUrl ? <UploadCloud className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
      <span className="font-medium text-foreground">{uploading ? 'Uploading cover image…' : isDragActive ? 'Drop image here' : previewUrl ? 'Drop an image here to replace the cover' : 'Drag and drop an image here'}</span>
      {!uploading && <span>or click to choose an image</span>}
    </div>
  </div>;
}
