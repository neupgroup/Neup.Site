
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
import { AlertCircle, Plus, Save, Trash2, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSource, getSources, deleteSource, type Source } from '@/actions/editor/sources';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceBasePath, setNewSourceBasePath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sourcesResult = await getSources();
      if (sourcesResult.success && sourcesResult.sources) {
        setSources(sourcesResult.sources);
      } else {
        setError(sourcesResult.error || 'Failed to fetch sources');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSource = async () => {
    if (!newSourceName || !newSourceBasePath) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a name and a base path.' });
      return;
    }
    setIsSaving(true);
    
    // For now, ownedBy is hardcoded, and methods are empty.
    // In a real app, you'd get the user ID.
    const result = await createSource({ 
        name: newSourceName, 
        basePath: newSourceBasePath,
        methods: [],
        permitControl: false,
        ownedBy: 'system'
    });

    if (result.success) {
      toast({ title: 'Source Created!', description: `Successfully created ${newSourceName}.` });
      setNewSourceName('');
      setNewSourceBasePath('');
      fetchData(); // Refresh list
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }

    setIsSaving(false);
  };

  const handleDeleteSource = async (id: string) => {
    const result = await deleteSource(id);
    if (result.success) {
      toast({ title: 'Source Deleted', description: 'The data source has been removed.' });
      fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Data Source</CardTitle>
          <CardDescription>Add a new API endpoint to fetch data from.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-name">Source Name</Label>
            <Input id="source-name" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="e.g., My CRM API" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-path">Base Path</Label>
            <Input id="base-path" value={newSourceBasePath} onChange={e => setNewSourceBasePath(e.target.value)} placeholder="https://api.example.com/v1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateSource} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Source'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Data Sources</CardTitle>
          <CardDescription>A list of all your currently configured data sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Base Path</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        <Database className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        No data sources created yet.
                    </TableCell>
                  </TableRow>
                )}
                {sources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{source.basePath}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Delete Source">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the data source "{source.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSource(source.id)}>
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
