
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, FileText, AlertCircle, Loader2, CheckCircle, Trash2, Edit, HardDrive, RotateCcw, Save, FileJson, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getSiteServers } from '@/actions/servers';
import { getAppBaseFiles, getAppBaseFileContent, saveAppBaseFileContent, backupAppBaseFile } from '@/actions/app-base';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AppBaseFile {
  name: string;
  size: string;
}

export default function AppBasePage() {
  const [files, setFiles] = useState<AppBaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<AppBaseFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const { toast } = useToast();

  const fetchServerAndFiles = useCallback(async () => {
    setLoading(true);
    const serverResult = await getSiteServers();
    if (serverResult.success && serverResult.servers && serverResult.servers.length > 0) {
      const currentServerId = serverResult.servers[0].id;
      setServerId(currentServerId);
      const filesResult = await getAppBaseFiles(currentServerId);
      if (filesResult.success && filesResult.files) {
        setFiles(filesResult.files);
      } else {
        setError(filesResult.error || 'Failed to fetch app base files.');
      }
    } else {
      setError(serverResult.error || 'No server allocated to this site.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServerAndFiles();
  }, [fetchServerAndFiles]);

  const handleEditClick = async (file: AppBaseFile) => {
    if (!serverId) return;
    setEditingFile(file);
    setIsEditorLoading(true);
    const result = await getAppBaseFileContent(serverId, file.name);
    if (result.success && result.content !== undefined) {
      setFileContent(result.content);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setEditingFile(null);
    }
    setIsEditorLoading(false);
  };
  
  const handleSaveContent = async () => {
    if (!serverId || !editingFile) return;
    setIsSaving(true);
    const result = await saveAppBaseFileContent(serverId, editingFile.name, fileContent);
    if (result.success) {
      toast({ title: 'File Saved' });
      setEditingFile(null);
      fetchServerAndFiles();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  const handleBackup = async (file: AppBaseFile) => {
    if (!serverId) return;
    setIsBackingUp(true);
    const result = await backupAppBaseFile(serverId, file.name);
    if (result.success) {
      toast({ title: 'Backup Created', description: `A backup for ${file.name} has been saved.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsBackingUp(false);
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">App Base Files</h1>
          <p className="text-muted-foreground">Manage JSON configuration files in your application's base directory.</p>
        </div>
        <div className="flex gap-2">
           <Button asChild variant="outline">
              <Link href="/site/appbase/backups">
                  <RotateCcw className="mr-2 h-4 w-4" /> View Backups
              </Link>
            </Button>
            <Button asChild>
                <Link href="/site/appbase/create">
                    <Plus className="mr-2 h-4 w-4" /> Create File
                </Link>
            </Button>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>Files located in the `[appPath]/base` directory on your server.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : error ? (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : files.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <FileJson className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Files Found</h3>
              <p>Click "Create File" to add a new JSON configuration file.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Filename</TableHead><TableHead>Size</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-mono">{file.name}</TableCell>
                    <TableCell>{file.size} B</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleBackup(file)} disabled={isBackingUp} className="mr-2">
                           {isBackingUp ? <Loader2 className="animate-spin mr-2"/> : <HardDrive className="mr-2"/>} Backup
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditClick(file)}>
                            <Edit className="mr-2"/> Edit
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
       <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
        <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit {editingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isEditorLoading ? <Skeleton className="h-full w-full" /> : (
              <Textarea 
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="h-full font-mono resize-none"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>Cancel</Button>
            <Button onClick={handleSaveContent} disabled={isSaving || isEditorLoading}>
                {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
