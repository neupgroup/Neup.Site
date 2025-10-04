
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Link as LinkIcon, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPath, getPaths, deletePath, type Path } from '@/actions/paths';
import { getPages, type Page } from '@/actions/editor/pages';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PathsPage() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newPath, setNewPath] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathsResult, pagesResult] = await Promise.all([getPaths(), getPages()]);

      if (pathsResult.success && pathsResult.paths) {
        setPaths(pathsResult.paths);
      } else {
        setError(pathsResult.error || 'Failed to fetch paths');
      }

      if (pagesResult.success && pagesResult.pages) {
        setPages(pagesResult.pages);
      } else {
        setError(pagesResult.error || 'Failed to fetch pages');
      }
    } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePath = async () => {
    if (!newPath || !selectedPageId) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide both a path and a page.' });
        return;
    }
    setIsSaving(true);
    let finalPath = newPath.trim();
    if (!finalPath.startsWith('/')) {
        finalPath = `/${finalPath}`;
    }

    const result = await createPath(finalPath, selectedPageId);
    if (result.success) {
        toast({ title: 'Path Created!', description: `Successfully mapped ${finalPath} to your selected page.` });
        setNewPath('');
        setSelectedPageId('');
        fetchData(); // Refresh list
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }

    setIsSaving(false);
  }

  const handleDeletePath = async (id: string) => {
    const result = await deletePath(id);
    if(result.success) {
        toast({ title: 'Path Deleted', description: 'The path mapping has been removed.'});
        fetchData();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Path</CardTitle>
          <CardDescription>Map a URL path to one of your pages.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="path">URL Path</Label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="path" value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="/about-us" className="pl-10" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="page">Page to Display</Label>
                <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                    <SelectTrigger id="page">
                        <SelectValue placeholder="Select a page..." />
                    </SelectTrigger>
                    <SelectContent>
                        {pages.map(page => (
                            <SelectItem key={page.id} value={page.id}>Page: {page.name || page.id.substring(0, 8) + '...'}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleCreatePath} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Path'}
            </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Paths</CardTitle>
          <CardDescription>A list of all your currently active URL paths.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Path</TableHead>
                            <TableHead>Mapped Page ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paths.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No paths created yet.</TableCell>
                            </TableRow>
                        )}
                        {paths.map(path => (
                            <TableRow key={path.id}>
                                <TableCell className="font-medium">
                                    <Link href={path.path} target="_blank" className="hover:underline">{path.path}</Link>
                                </TableCell>
                                <TableCell>{path.pageId}</TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" title="Delete Path">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the path <span className="font-mono bg-muted p-1 rounded">{path.path}</span>.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(path.id)}>
                                                Delete
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
