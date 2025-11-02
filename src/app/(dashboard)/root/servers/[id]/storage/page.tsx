
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, FilePlus, Server as ServerIcon, User, Folder as FolderIcon } from 'lucide-react';
import { getDetailedStorageForServer, type DetailedStorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';
import FileManagerPage from '../files/page';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createFile } from '@/actions/server/management/create-file';
import { useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

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

const StorageAnalysis = ({ serverId }: { serverId: string }) => {
    const [storageInfo, setStorageInfo] = useState<DetailedStorageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStorage = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getDetailedStorageForServer(serverId);
        if (result.success && result.data) {
          setStorageInfo(result.data);
        } else {
          setError(result.error || 'Failed to fetch storage info.');
        }
        setIsLoading(false);
    }, [serverId]);
    
    useEffect(() => {
        fetchStorage();
    }, [fetchStorage]);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Storage Analysis</CardTitle>
                    <CardDescription>A detailed breakdown of disk usage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Storage Analysis</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!storageInfo) return null;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Storage Analysis</CardTitle>
                <CardDescription>A detailed breakdown of disk usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium">{storageInfo.total.usePercentage} Used</p>
                        <p className="text-sm text-muted-foreground">{storageInfo.total.used} of {storageInfo.total.size}</p>
                    </div>
                    <Progress value={parseInt(storageInfo.total.usePercentage)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <h4 className="font-semibold flex items-center gap-2"><ServerIcon className="h-4 w-4" /> System</h4>
                        <p className="text-2xl font-bold">{storageInfo.system.used}</p>
                        <p className="text-xs text-muted-foreground">OS & other files</p>
                    </div>
                     <div className="p-4 rounded-lg border bg-muted/30">
                        <h4 className="font-semibold flex items-center gap-2"><FolderIcon className="h-4 w-4" /> Swap</h4>
                        <p className="text-2xl font-bold">{storageInfo.swap.used}</p>
                        <p className="text-xs text-muted-foreground">{storageInfo.swap.total} Total</p>
                    </div>
                     {storageInfo.users.map(user => (
                        <div key={user.name} className="p-4 rounded-lg border bg-muted/30">
                            <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> {user.name}</h4>
                            <p className="text-2xl font-bold">{user.used}</p>
                            <p className="text-xs text-muted-foreground">in /home/{user.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


export default function StoragePage({ params }: { params: { id: string } }) {
  const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '/';

  return (
    <div className="space-y-6">
        <CreateFileDialog 
            serverId={params.id}
            currentPath={currentPath}
            open={isCreateFileDialogOpen}
            onOpenChange={setIsCreateFileDialogOpen}
            onCreateSuccess={() => { /* The FileManagerPage will need to be re-rendered */ location.reload(); }}
        />
        <div className="flex justify-between items-start">
             <div>
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Storage & File Manager</h1>
                <p className="text-muted-foreground">Manage files and view disk usage for this server.</p>
            </div>
            <Button variant="outline" onClick={() => setIsCreateFileDialogOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                Create File
            </Button>
        </div>
        <FileManagerPage params={params} />
        <Separator />
        <StorageAnalysis serverId={params.id} />
    </div>
  );
};
