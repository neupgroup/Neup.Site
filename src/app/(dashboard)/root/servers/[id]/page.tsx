'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getServer, deleteServer, type Server } from '@/actions/servers';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Share2, Package, GitCommit, Disc } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [swapSize, setSwapSize] = useState('3072');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchServer = async () => {
      setLoading(true);
      const result = await getServer(id);
      if (result.success && result.server) {
        setServer(result.server);
      } else {
        setError(result.error || 'Failed to fetch server.');
      }
      setLoading(false);
    };

    fetchServer();
  }, [id]);
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServer(id);
    if(result.success) {
        toast({ title: 'Server Deleted', description: 'The server has been removed.'});
        router.push('/root/servers');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }
  
  if (loading) {
    return (
        <Card className="w-full">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    );
  }

  if (error || !server) {
    return (
      <div className="w-full">
         <div className="mb-4">
            <Button asChild variant="outline">
              <Link href="/root/servers">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Servers
              </Link>
            </Button>
        </div>
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Server not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/root/servers">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Servers
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{server.name}</CardTitle>
                        <CardDescription>ID: {server.id}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Public IP</h4>
                    <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:underline">
                        {server.publicIp}
                    </a>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Created On</h4>
                    <p className="text-sm">{server.createdOn ? new Date(server.createdOn).toLocaleString() : 'N/A'}</p>
                </div>
                 {server.expiresOn && (
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                        <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
                 <Button asChild variant="outline">
                    <Link href={`/root/servers/allocations/create?serverId=${id}`}>
                        <Share2 className="mr-2 h-4 w-4"/> Allocate Server
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={`/root/servers/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Management</CardTitle>
            <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">Update & Upgrade Server</h4>
                <p className="text-sm text-muted-foreground">Run apt-get update &amp;&amp; apt-get upgrade.</p>
              </div>
              <Button><GitCommit className="mr-2 h-4 w-4" /> Run Update</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
               <div>
                <h4 className="font-medium">Install npm</h4>
                <p className="text-sm text-muted-foreground">Install Node.js and the Node Package Manager.</p>
              </div>
              <Button><Package className="mr-2 h-4 w-4" /> Install npm</Button>
            </div>
            <div className="rounded-lg border p-4">
                <h4 className="font-medium">Create Swap Space</h4>
                <p className="text-sm text-muted-foreground">Create a swap file to use as virtual RAM.</p>
                <div className="flex items-center gap-2 mt-3">
                    <Input 
                        id="swap-size"
                        value={swapSize}
                        onChange={(e) => setSwapSize(e.target.value)}
                        className="max-w-[120px]"
                    />
                     <Label htmlFor="swap-size" className="text-sm text-muted-foreground">MB</Label>
                    <Button className="ml-auto"><Disc className="mr-2 h-4 w-4" /> Create Swap</Button>
                </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the server "{server.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
