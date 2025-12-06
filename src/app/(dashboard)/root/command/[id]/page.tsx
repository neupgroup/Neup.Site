
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getServerCommand, deleteServerCommand, type ServerCommand } from '@/actions/commands';
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
import { AlertCircle, ArrowLeft, Trash2, Command as CommandIcon, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CommandDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [command, setCommand] = useState<ServerCommand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCommand = async () => {
      setLoading(true);
      const result = await getServerCommand(id);
      if (result.success && result.command) {
        setCommand(result.command);
      } else {
        setError(result.error || 'Failed to fetch command.');
      }
      setLoading(false);
    };

    fetchCommand();
  }, [id]);
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServerCommand(id);
    if(result.success) {
        toast({ title: 'Command Deleted', description: 'The command template has been removed.'});
        router.push('/root/command');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const getDangerVariant = (danger?: 'low' | 'mid' | 'high') => {
      switch(danger) {
          case 'high': return 'destructive';
          case 'mid': return 'secondary';
          default: return 'outline';
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

  if (error || !command) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Command not found.'}</AlertDescription>
         <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/root/command">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Commands
              </Link>
            </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-4xl">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/root/command">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Commands
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{command.name}</CardTitle>
                        <CardDescription>{command.description || 'No description'}</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Badge variant={getDangerVariant(command.danger)} className="capitalize">{command.danger}</Badge>
                        <Badge variant="secondary" className="capitalize">{command.type}</Badge>
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Command Template</h4>
                    <pre className="text-sm bg-muted p-3 mt-1 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                        {command.commandTemplate}
                    </pre>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Parameters</h4>
                    {command.parameters && command.parameters.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Confidential</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {command.parameters.map(p => (
                                    <TableRow key={p.key}>
                                        <TableCell className="font-mono">{p.key}</TableCell>
                                        <TableCell>{p.label}</TableCell>
                                        <TableCell className="capitalize">{p.type}</TableCell>
                                        <TableCell className="font-mono">{p.defaultValue || 'N/A'}</TableCell>
                                        <TableCell>{p.confidential ? <KeyRound className="h-4 w-4 text-amber-500" /> : 'No'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">No user-defined parameters.</p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this command template.
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
