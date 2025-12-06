
'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getFileList, type FileInfo } from '@/actions/server/management/get-file-list';
import { readFileContent } from '@/actions/server/management/read-file-content';
import { saveFileContent } from '@/actions/server/management/save-file-content';
import { Folder, FileText, Link as LinkIcon, AlertCircle, ArrowLeft, Loader2 as Spinner, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function FileManagerPage() {
    const params = useParams<{ id: string }>();
    const serverId = params.id;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const currentPath = searchParams.get('path') || '/';

    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<{ path: string; content: string; } | null>(null);
    const [pathInputValue, setPathInputValue] = useState(currentPath);

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
            {editingFile && (
                <FileEditorDialog
                    file={editingFile}
                    serverId={serverId}
                    onClose={() => setEditingFile(null)}
                    onSaveSuccess={() => fetchFiles(currentPath)}
                />
            )}
            <CardHeader>
                <CardTitle>File Manager</CardTitle>
                <CardDescription>Browse and edit files on your server.</CardDescription>
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
                            <div key={file.name} className={cn("flex items-center gap-2 text-sm p-1 rounded-md cursor-pointer hover:bg-muted/50")} onClick={() => handleFileClick(file)}>
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
                                <span className="font-mono text-xs text-muted-foreground flex-1 text-right">{formatFileSize(file.size)}</span>
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
