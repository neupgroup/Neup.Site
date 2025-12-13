
'use client';
import { useCallback, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getFileList, type FileInfo } from '@/actions/server/management/get-file-list';
import { createFile } from '@/actions/server/management/create-file';
import { readFileContent } from '@/actions/server/management/read-file-content';
import { saveFileContent } from '@/actions/server/management/save-file-content';
import { deletePath } from '@/actions/server/management/delete-path';
import { Folder, FileText, Link as LinkIcon, AlertCircle, ArrowLeft, Loader2 as Spinner, Save, FilePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { getDetailedStorageForServer, type DetailedStorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';
import { Progress } from '@/components/ui/progress';
import { Server as ServerIcon, User, Folder as FolderIcon } from 'lucide-react';

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


const FileEditorDialog = ({ file, serverId, onClose, onSaveSuccess }: { file: { path: string; content: string }, serverId: string, onClose: () => void, onSaveSuccess: () => void }) => {
    const [content, setContent] = useState(file.content);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveFileContent(serverId, file.path, content);
        if (result.success) {
            toast({ title: 'File Saved', description: `Successfully saved ${file.path}` });
            onSaveSuccess();
            onClose();
        } else {
            toast({ variant: 'destructive', title: 'Error Saving File', description: result.error });
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit File</DialogTitle>
                    <DialogDescription className="font-mono">{file.path}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="h-full w-full font-mono text-xs resize-none"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FileManager = ({ serverId }: { serverId: string }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const currentPath = searchParams.get('path') || '/';

    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<{ path: string; content: string; } | null>(null);
    const [deletingFile, setDeletingFile] = useState<FileInfo | null>(null);
    const [pathInputValue, setPathInputValue] = useState(currentPath);
    const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);


    const navigate = useCallback((newPath: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('path', newPath);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const fetchFiles = useCallback(async (path: string) => {
        setIsLoading(true);
        setError(null);
        const result = await getFileList(serverId, path);
        if (result.success && result.files) {
            setFiles(result.files);
        } else {
            setError(result.error || 'Failed to list files.');
        }
        setIsLoading(false);
    }, [serverId]);

    useEffect(() => {
        fetchFiles(currentPath);
        setPathInputValue(currentPath);
    }, [fetchFiles, currentPath]);

    const handleFileClick = async (file: FileInfo) => {
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${file.name}`;
        if (file.type === 'd') {
            navigate(fullPath);
        } else if (file.type === 'l' && file.targetPath) {
            if (file.targetPath.startsWith('/')) {
                navigate(file.targetPath);
            } else {
                navigate(`${currentPath}/${file.targetPath}`);
            }
        } else if (file.type === '-') {
            toast({ title: "Loading file..." });
            const result = await readFileContent(serverId, fullPath);
            if (result.success && result.content !== null) {
                setEditingFile({ path: fullPath, content: result.content || '' });
            } else {
                toast({ variant: 'destructive', title: 'Error Reading File', description: result.error });
            }
        }
    };

    const goUp = () => {
        if (currentPath === '/') return;
        const pathParts = currentPath.split('/').filter(Boolean);
        pathParts.pop();
        const newPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
        navigate(newPath);
    };

    const handleDelete = async () => {
        if (!deletingFile) return;
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${deletingFile.name}`;

        const result = await deletePath(serverId, fullPath);
        if (result.success) {
            toast({ title: 'Deleted', description: `${deletingFile.name} has been deleted.` });
            fetchFiles(currentPath);
        } else {
            toast({ variant: 'destructive', title: 'Error Deleting', description: result.error });
        }
        setDeletingFile(null);
    }

    const handlePathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPathInputValue(e.target.value);
    }

    const handlePathInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigate(pathInputValue);
        }
    };

    const getFileIcon = (type: FileInfo['type']) => {
        switch (type) {
            case 'd': return <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
            case 'l': return <LinkIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
            default: return <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
        }
    }

    const formatFileSize = (size: string): string => {
        if (/^[0-9.]+$/.test(size)) {
            const bytes = parseInt(size, 10);
            if (isNaN(bytes) || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        return size.replace('K', ' KB').replace('M', ' MB').replace('G', ' GB');
    }

    return (
        <Card>
             <CreateFileDialog
                serverId={serverId}
                currentPath={currentPath}
                open={isCreateFileDialogOpen}
                onOpenChange={setIsCreateFileDialogOpen}
                onCreateSuccess={() => fetchFiles(currentPath)}
            />
            {editingFile && (
                <FileEditorDialog
                    file={editingFile}
                    serverId={serverId}
                    onClose={() => setEditingFile(null)}
                    onSaveSuccess={() => fetchFiles(currentPath)}
                />
            )}
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>File Manager</CardTitle>
                        <CardDescription>Browse and edit files on your server.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => setIsCreateFileDialogOpen(true)}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Create File
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Input
                        value={pathInputValue}
                        onChange={handlePathInputChange}
                        onKeyDown={handlePathInputSubmit}
                        className="font-mono"
                    />
                </div>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
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
                            <div key={file.name} className={cn("flex items-center gap-2 text-sm p-1 rounded-md group")}>
                                <div className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-muted/50" onClick={() => handleFileClick(file)}>
                                    {getFileIcon(file.type)}
                                    <span className="font-mono truncate">{file.name}</span>
                                    {file.targetPath && (
                                        <>
                                            <span className="text-muted-foreground text-xs">&gt;&gt;</span>
                                            <span
                                                className={cn("font-mono text-xs text-muted-foreground truncate", file.targetPath.startsWith('/') && "cursor-pointer hover:underline text-blue-500")}
                                                onClick={(e) => {
                                                    if (file.targetPath?.startsWith('/')) {
                                                        e.stopPropagation();
                                                        navigate(file.targetPath);
                                                    }
                                                }}
                                            >
                                                {file.targetPath}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <span className="font-mono text-xs text-muted-foreground text-right">{formatFileSize(file.size)}</span>
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
    )
}

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


export default function StoragePage() {
    const params = useParams<{ id: string }>();

    return (
        <div className="space-y-6">
             <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Storage & File Manager</h1>
                <p className="text-muted-foreground">Manage files and view disk usage for this server.</p>
            </header>
            <FileManager serverId={params.id} />
            <Separator />
            <StorageAnalysis serverId={params.id} />
        </div>
    );
};
