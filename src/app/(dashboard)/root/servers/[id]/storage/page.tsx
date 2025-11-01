
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, FilePlus } from 'lucide-react';
import { getDetailedStorageForServer, type StorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';
import FileManagerPage from '../files/page';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createFile } from '@/actions/server/management/create-file';
import { usePathname, useSearchParams } from 'next/navigation';

const CreateFileDialog = ({ serverId, currentPath, open, onOpenChange, onCreateSuccess }: { serverId: string; currentPath: string; open: boolean; onOpenChange: (open: boolean) => void; onCreateSuccess: () => void; }) => {
    const [filename, setFilename] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const handleCreate = async () => {
        if (!filename) {
            toast({ variant: 'destructive', title: 'Filename cannot be empty' });
            return;
        }
        setIsCreating(true);
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${filename}`;
        const result = await createFile(serverId, fullPath);
        if (result.success) {
            toast({ title: 'File Created', description: `Successfully created ${fullPath}` });
            onCreateSuccess();
            onOpenChange(false);
            setFilename('');
        } else {
            toast({ variant: 'destructive', title: 'Error Creating File', description: result.error });
        }
        setIsCreating(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New File</DialogTitle>
                    <DialogDescription>
                        Enter the name for the new file to be created in <code className="bg-muted px-1 font-mono">{currentPath}</code>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="filename">Filename</Label>
                    <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function StorageStatusPage({ params }: { params: { id: string } }) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '/';

  const fetchStorage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getDetailedStorageForServer(params.id);
    if (result.success && result.data) {
      setStorageInfo(result.data);
    } else {
      setError(result.error || 'Failed to fetch storage info.');
    }
    setIsLoading(false);
  }, [params.id]);
  
  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  return (
    <div className="space-y-6">
        <CreateFileDialog 
            serverId={params.id}
            currentPath={currentPath}
            open={isCreateFileDialogOpen}
            onOpenChange={setIsCreateFileDialogOpen}
            onCreateSuccess={() => { /* The FileManagerPage will need to be re-rendered */ location.reload(); }}
        />
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Storage Status</CardTitle>
                        <CardDescription>Real-time disk usage information.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsCreateFileDialogOpen(true)}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Create File
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-1/2" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : storageInfo ? (
                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{storageInfo.usePercentage} Used</p>
                    <p className="text-sm text-muted-foreground">{storageInfo.used} of {storageInfo.size}</p>
                    </div>
                    <Progress value={parseInt(storageInfo.usePercentage)} />
                </div>
                <div className="grid grid-cols-2 text-sm">
                    <div className="flex justify-between pr-4">
                        <span>Available:</span>
                        <span className="font-medium">{storageInfo.available}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Mounted On:</span>
                        <span className="font-mono">{storageInfo.mountedOn}</span>
                    </div>
                </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-4">
                <p>Could not retrieve storage information.</p>
                </div>
            )}
            </CardContent>
        </Card>
        <FileManagerPage params={params} />
    </div>
  );
};
