
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getServerAllocation, deleteServerAllocation, type ServerAllocation } from '@/actions/allocations';
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
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function AllocationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [allocation, setAllocation] = useState<ServerAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchAllocation = async () => {
      setLoading(true);
      const result = await getServerAllocation(id);
      if (result.success && result.allocation) {
        setAllocation(result.allocation);
      } else {
        setError(result.error || 'Failed to fetch allocation.');
      }
      setLoading(false);
    };

    fetchAllocation();
  }, [id]);
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServerAllocation(id);
    if(result.success) {
        toast({ title: 'Allocation Deleted', description: 'The server allocation has been removed.'});
        router.push('/root/servers/allocations');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }
  
  if (loading) {
    return (
        <Card className="w-full max-w-2xl">
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

  if (error || !allocation) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Allocation not found.'}</AlertDescription>
         <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/root/servers/allocations">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Allocations
              </Link>
            </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/root/servers/allocations">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Allocations
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
                <CardDescription>ID: {allocation.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Site ID</h4>
                        <p className="font-mono text-sm">{allocation.siteId}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Server ID</h4>
                        <Link href={`/root/servers/${allocation.serverId}`} className="font-mono text-sm hover:underline">{allocation.serverId}</Link>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Username</h4>
                        <p className="font-mono text-sm">{allocation.username || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Deployment Path</h4>
                        <p className="font-mono text-sm">{allocation.deploymentPath || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Storage Allocation</h4>
                    <p className="text-sm">{allocation.storageAllocation ? `${allocation.storageAllocation} MB` : 'Not set'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Allocated Ports</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {allocation.allocatedPorts && allocation.allocatedPorts.length > 0 ? (
                            allocation.allocatedPorts.map(port => <Badge key={port} variant="secondary">{port}</Badge>)
                        ) : (
                            <p className="text-sm text-muted-foreground">No ports allocated.</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Allocated On</h4>
                        <p className="text-sm">{allocation.allocatedOn ? new Date(allocation.allocatedOn).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                        <p className="text-sm">{allocation.expiresOn ? new Date(allocation.expiresOn).toLocaleString() : 'N/A'}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
                <Button asChild>
                    <Link href={`/root/servers/allocations/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this server allocation.
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
