
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, FileText, Folder, AlertCircle, Loader2, CheckCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { uploadPublicFile, getPublicFiles, deletePublicFile, type PublicFile } from '@/actions/uploads';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface UploadingFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number; // 0-100
  speed?: number; // bytes per second
  startTime?: number;
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

  const folderCount = files.filter(f => f.type === 'directory').length;
  const fileCount = files.length - folderCount;

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
        <CardDescription>
          {loading ? 'Loading...' : `${folderCount} folders, ${fileCount} files`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Input value={pathInputValue} readOnly className="font-mono bg-muted" />
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-1">
            {currentPath !== '/' && (
              <div className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-muted/50 cursor-pointer" onClick={goUp}>
                <ArrowLeft className="h-4 w-4 text-primary" />
                <span className="font-mono flex-1 truncate text-primary">Go back</span>
              </div>
            )}
            {files.map(file => (
              <div key={file.name} className="flex items-center gap-2 text-sm p-1 rounded-md group">
                <div className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-muted/50" onClick={() => handleFileClick(file)}>
                  {getFileIcon(file.type)}
                  <span className="font-mono truncate">{file.name}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground text-right">
                  {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setDeletingFile(file)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <p>Directory is empty.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SiteUploadsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = searchParams.get('path') || '/';

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadPath, setUploadPath] = useState(currentPath);
  const [currentConcurrency, setCurrentConcurrency] = useState(1);

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
    const filesToUpload = uploadingFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    // Dynamic adaptive concurrency settings
    let concurrency = 1; // Start with 1
    const maxConcurrency = 8; // Max 8 concurrent uploads
    const minConcurrency = 1; // Min 1 concurrent upload

    // Performance tracking with sliding window (last 10 seconds of data)
    const performanceWindow = 10000; // 10 seconds
    const recentUploads: {
      fileName: string;
      speed: number; // bytes per second
      duration: number;
      fileSize: number;
      timestamp: number;
    }[] = [];

    const uploadQueue = [...filesToUpload];
    const activeUploads = new Set<string>();
    let totalCompleted = 0;
    let lastAdjustmentTime = Date.now();
    const adjustmentInterval = 10000; // Adjust every 10 seconds

    // Calculate performance metrics from recent uploads
    const getPerformanceMetrics = () => {
      const now = Date.now();
      const recentData = recentUploads.filter(u => now - u.timestamp < performanceWindow);

      if (recentData.length === 0) return null;

      // Calculate weighted average speed (larger files have more weight)
      const totalSize = recentData.reduce((sum, u) => sum + u.fileSize, 0);
      const weightedSpeed = recentData.reduce((sum, u) => {
        const weight = u.fileSize / totalSize;
        return sum + (u.speed * weight);
      }, 0);

      // Calculate throughput (total bytes / total time)
      const totalBytes = recentData.reduce((sum, u) => sum + u.fileSize, 0);
      const totalTime = recentData.reduce((sum, u) => sum + u.duration, 0);
      const throughput = totalTime > 0 ? (totalBytes / totalTime) * 1000 : 0;

      return {
        weightedSpeed,
        throughput,
        avgFileSize: totalSize / recentData.length,
        sampleCount: recentData.length
      };
    };

    // Decide whether to increase, decrease, or maintain concurrency
    const adjustConcurrency = () => {
      const metrics = getPerformanceMetrics();

      if (!metrics || metrics.sampleCount < 2) {
        // Not enough data yet, try doubling if we have queue
        if (uploadQueue.length > 0 && concurrency < maxConcurrency) {
          const newConcurrency = Math.min(maxConcurrency, concurrency * 2); // Double: 1→2→4→8
          if (newConcurrency !== concurrency) {
            concurrency = newConcurrency;
            setCurrentConcurrency(concurrency);
            console.log(`🚀 Doubling concurrency to ${concurrency} (exploring capacity)`);
          }
        }
        return;
      }

      const { weightedSpeed, throughput, avgFileSize } = metrics;

      // Dynamic thresholds based on file size
      // Smaller files: lower speed threshold (50 KB/s)
      // Larger files: higher speed threshold (200 KB/s)
      const baseThreshold = 50 * 1024; // 50 KB/s
      const maxThreshold = 200 * 1024; // 200 KB/s
      const sizeThreshold = Math.min(maxThreshold, baseThreshold + (avgFileSize / 1024) * 1024);

      console.log(`📊 Metrics: Speed=${(weightedSpeed / 1024).toFixed(2)} KB/s, Throughput=${(throughput / 1024).toFixed(2)} KB/s, AvgSize=${(avgFileSize / 1024).toFixed(2)} KB, Threshold=${(sizeThreshold / 1024).toFixed(2)} KB/s, Concurrency=${concurrency}`);

      // Decision logic
      if (throughput > sizeThreshold && concurrency < maxConcurrency) {
        // Performance is good, double concurrency: 1→2→4→8
        const newConcurrency = Math.min(maxConcurrency, concurrency * 2);
        if (newConcurrency !== concurrency) {
          concurrency = newConcurrency;
          setCurrentConcurrency(concurrency);
          console.log(`📈 Doubling concurrency to ${concurrency} (good performance: ${(throughput / 1024).toFixed(2)} KB/s)`);
        }
      } else if (throughput < sizeThreshold * 0.5 && concurrency > minConcurrency) {
        // Performance is poor, halve concurrency: 8→4→2→1
        const newConcurrency = Math.max(minConcurrency, Math.floor(concurrency / 2));
        if (newConcurrency !== concurrency) {
          concurrency = newConcurrency;
          setCurrentConcurrency(concurrency);
          console.log(`📉 Halving concurrency to ${concurrency} (poor performance: ${(throughput / 1024).toFixed(2)} KB/s)`);
        }
      } else {
        console.log(`➡️ Maintaining concurrency at ${concurrency} (stable performance)`);
      }
    };

    const uploadFile = async (fileToUpload: UploadingFile) => {
      const startTime = Date.now();
      activeUploads.add(fileToUpload.file.name);

      try {
        // Update status to uploading
        setUploadingFiles(prev => prev.map(f =>
          f.file.name === fileToUpload.file.name
            ? { ...f, status: 'uploading', startTime, progress: 0 }
            : f
        ));

        const content = await readFileAsBase64(fileToUpload.file);

        // Progress updates with better estimation
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f => {
            if (f.file.name === fileToUpload.file.name && f.status === 'uploading') {
              const elapsed = Date.now() - startTime;
              // Estimate based on file size and average speed
              const metrics = getPerformanceMetrics();
              const estimatedDuration = metrics
                ? (fileToUpload.file.size / metrics.throughput) * 1000
                : 5000;
              const estimatedProgress = Math.min(90, (elapsed / estimatedDuration) * 100);
              return { ...f, progress: estimatedProgress };
            }
            return f;
          }));
        }, 200);

        const result = await uploadPublicFile(uploadPath, content, fileToUpload.file.name);
        clearInterval(progressInterval);

        const endTime = Date.now();
        const duration = endTime - startTime;
        const speed = (fileToUpload.file.size / duration) * 1000; // bytes per second

        if (result.success) {
          setUploadingFiles(prev => prev.map(f =>
            f.file.name === fileToUpload.file.name
              ? { ...f, status: 'success', progress: 100, speed }
              : f
          ));

          // Add to recent uploads for performance tracking
          recentUploads.push({
            fileName: fileToUpload.file.name,
            speed,
            duration,
            fileSize: fileToUpload.file.size,
            timestamp: endTime
          });

          totalCompleted++;

          // Clean up old data outside the window
          const now = Date.now();
          while (recentUploads.length > 0 && now - recentUploads[0].timestamp > performanceWindow) {
            recentUploads.shift();
          }
        } else {
          throw new Error(result.error);
        }
      } catch (e: any) {
        setUploadingFiles(prev => prev.map(f =>
          f.file.name === fileToUpload.file.name
            ? { ...f, status: 'error', error: e.message, progress: 0 }
            : f
        ));
      } finally {
        activeUploads.delete(fileToUpload.file.name);
      }
    };

    // Process queue with dynamic adaptive concurrency
    const processQueue = async () => {
      while (uploadQueue.length > 0 || activeUploads.size > 0) {
        // Check if it's time to adjust concurrency
        const now = Date.now();
        if (now - lastAdjustmentTime >= adjustmentInterval) {
          adjustConcurrency();
          lastAdjustmentTime = now;
        }

        // Start new uploads up to current concurrency limit
        while (uploadQueue.length > 0 && activeUploads.size < concurrency) {
          const nextFile = uploadQueue.shift();
          if (nextFile) {
            uploadFile(nextFile); // Don't await - let it run in parallel
          }
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    await processQueue();

    // Show completion message
    setTimeout(() => {
      setUploadingFiles([]);
      const metrics = getPerformanceMetrics();
      const avgSpeed = metrics ? (metrics.throughput / 1024).toFixed(2) : 'N/A';
      toast({
        title: 'Uploads Finished',
        description: `${totalCompleted} file(s) uploaded successfully. Avg speed: ${avgSpeed} KB/s`
      });

      // Refresh the file list
      const params = new URLSearchParams(searchParams);
      router.push(`${pathname}?${params.toString()}`);
    }, 1500);
  };

  const uploadingCount = uploadingFiles.filter(f => f.status === 'uploading').length;
  const pendingCount = uploadingFiles.filter(f => f.status === 'pending').length;

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Uploads</h1>
        <p className="text-muted-foreground">Manage your site's public assets with intelligent parallel uploads.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files here to upload them to the specified directory.
            {uploadingCount > 0 && (
              <span className="block mt-1 text-primary font-medium">
                ⚡ Uploading {uploadingCount} file(s) • Concurrency: {currentConcurrency}x
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps({ className: cn("p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50") })}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>{isDragActive ? "Drop to upload" : "Drag 'n' drop files here, or click to select"}</p>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="upload-path">Upload Location</Label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm h-10">
                /public
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
                    <p className="text-sm font-medium">{uf.file.name}</p>
                    {uf.status === 'uploading' && uf.progress !== undefined && (
                      <div className="mt-1">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uf.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {uf.progress.toFixed(0)}%
                          {uf.speed && ` • ${(uf.speed / 1024).toFixed(2)} KB/s`}
                        </p>
                      </div>
                    )}
                    {uf.status === 'success' && uf.speed && (
                      <p className="text-xs text-green-600">
                        ✓ Uploaded at {(uf.speed / 1024).toFixed(2)} KB/s
                      </p>
                    )}
                    {uf.status === 'error' && <p className="text-xs text-destructive">{uf.error}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(uf.file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              ))}
              <Button onClick={handleUpload} disabled={uploadingFiles.some(f => f.status === 'uploading')}>
                Upload {pendingCount} file(s)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <FileManager />
    </div>
  );
}
