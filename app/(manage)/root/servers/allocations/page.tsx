
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllocations, type Allocation } from '@/actions/allocations';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Share2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      const result = await getAllocations();
      if (result.success && result.allocations) {
        setAllocations(result.allocations);
      } else {
        setError(result.error || 'Failed to fetch allocations');
      }
      setLoading(false);
    };

    fetchAllocations();
  }, []);

  const getStatusVariant = (status: Allocation['status']) => {
    switch(status) {
        case 'active': return 'default';
        case 'pending': return 'secondary';
        case 'error': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-4">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Server Allocations</h1>
            <p className="text-muted-foreground">Manage which sites are deployed to which servers.</p>
        </div>
        <Button asChild>
          <Link href="/root/servers/allocations/create">
            <Plus className="mr-2 h-4 w-4" /> Create Allocation
          </Link>
        </Button>
      </header>
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-4">
                 <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="p-4">
                <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
                <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Allocations Yet</h3>
                <p>Click "Create Allocation" to assign a site to a server.</p>
            </div>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artifact ID</TableHead>
                  <TableHead>Server ID</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allocated On</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((alloc) => (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-mono">{alloc.artifactId}</TableCell>
                    <TableCell className="font-mono">{alloc.serverId}</TableCell>
                    <TableCell>{alloc.port}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(alloc.status)} className={cn('capitalize', alloc.status === 'active' && 'bg-green-600')}>{alloc.status}</Badge>
                    </TableCell>
                    <TableCell>{alloc.allocatedOn ? new Date(alloc.allocatedOn).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                         <Button asChild variant="ghost" size="icon">
                            <Link href={`/root/servers/allocations/${alloc.id}`}>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
    </div>
  );
}
