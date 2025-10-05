
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Loader2, AlertCircle, KeyRound, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServer, updateServer, deleteServer, type Server } from '@/actions/servers';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type FormValues = Omit<Server, 'id' | 'createdOn'>;

export default function EditServerPage({ params }: { params: { id:string } }) {
  const { id } = params;
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, watch, formState: { isSubmitting }, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '', // This will not be populated from the server
      expiresOn: null,
    }
  });

  const expiresOn = watch('expiresOn');

  useEffect(() => {
    const fetchServer = async () => {
      setLoading(true);
      const result = await getServer(id);
      if (result.success && result.server) {
        setServer(result.server);
        reset({
          name: result.server.name,
          publicIp: result.server.publicIp,
          privateIp: result.server.privateIp || '',
          privateKey: '', // Keep private key field blank for security
          expiresOn: result.server.expiresOn || null,
        });
      } else {
        setError(result.error || 'Failed to fetch server details.');
      }
      setLoading(false);
    };

    fetchServer();
  }, [id, reset]);

  const handleUpdateServer = async (data: FormValues) => {
    const result = await updateServer(id, data);

    if (result.success) {
      toast({ title: 'Server Updated!', description: `Successfully updated ${data.name}.` });
      router.push(`/root/servers/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

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
      <Card className="w-full max-w-2xl">
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
        <form onSubmit={handleSubmit(handleUpdateServer)} className="w-full max-w-2xl space-y-6">
        <div className="mb-4">
            <Button variant="ghost" asChild>
            <Link href={`/root/servers/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Server Details
            </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Edit Server</CardTitle>
            <CardDescription>Update the details for this server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="server-name">Server Name</Label>
                    <Input id="server-name" {...register('name')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="public-ip">Public IP</Label>
                    <Input id="public-ip" {...register('publicIp')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expires-on">Expires On</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !expiresOn && "text-muted-foreground")}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresOn ? format(new Date(expiresOn), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={expiresOn ? new Date(expiresOn) : undefined}
                                onSelect={(date) => setValue('expiresOn', date?.toISOString() || null)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>
        
        <Card className="mt-6 border-amber-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                    <KeyRound className="h-5 w-5" />
                    Override Private Credentials
                </CardTitle>
                <CardDescription>
                    These fields are write-only. Fill them in only if you need to update the private IP or private key.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="private-ip">New Private IP (Optional)</Label>
                    <Input id="private-ip" {...register('privateIp')} placeholder="Leave blank to keep existing" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="private-key">New Private Key (Optional)</Label>
                    <Textarea id="private-key" {...register('privateKey')} placeholder="Leave blank to keep existing" rows={8} />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-between items-center sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm mt-6">
            <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4"/> Delete Server
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>

        </form>
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the server "{server?.name}".
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
