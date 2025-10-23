
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Save, ArrowLeft, Loader2, AlertCircle, KeyRound, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


type FormValues = Omit<Server, 'id' | 'createdOn'>;

export default function EditServerPage({ params }: { params: { id:string } }) {
  const { id } = params;
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrivateKeyField, setShowPrivateKeyField] = useState(false);
  const [showPrivateIpField, setShowPrivateIpField] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, watch, formState: { isSubmitting }, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '', 
      serverType: 'vps',
      provider: '',
      portsOpen: [],
      usedPorts: [],
      isPrivate: false,
      username: '',
      basePath: '',
      expiresOn: null,
    }
  });

  const { fields: portFields, append: appendPort, remove: removePort } = useFieldArray({
    control,
    name: 'portsOpen',
  });
  
  const { fields: usedPortFields, append: appendUsedPort, remove: removeUsedPort } = useFieldArray({
    control,
    name: 'usedPorts',
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
          privateIp: '', // Leave blank for security
          privateKey: '', // Keep private key field blank for security
          serverType: result.server.serverType || 'vps',
          provider: result.server.provider || '',
          portsOpen: result.server.portsOpen?.map(p => ({ value: p })) as any || [],
          usedPorts: result.server.usedPorts || [],
          isPrivate: result.server.isPrivate || false,
          username: result.server.username || '',
          basePath: result.server.basePath || '',
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
    const ports = (data.portsOpen as any[])
        .map(p => p.value)
        .filter(p => p !== '' && !isNaN(p))
        .map(p => Number(p));
    
    const result = await updateServer(id, {...data, portsOpen: ports});

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
  
  const toggleCredentialField = (field: 'privateKey' | 'privateIp') => {
      if (field === 'privateKey') {
          if (showPrivateKeyField) {
              setValue('privateKey', '');
          }
          setShowPrivateKeyField(!showPrivateKeyField);
      } else if (field === 'privateIp') {
          if (showPrivateIpField) {
              setValue('privateIp', '');
          }
          setShowPrivateIpField(!showPrivateIpField);
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
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="server-type">Server Type</Label>
                        <Select onValueChange={(value) => setValue('serverType', value as any)} defaultValue={watch('serverType')}>
                            <SelectTrigger id="server-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vps">VPS</SelectItem>
                                <SelectItem value="dedicated">Dedicated</SelectItem>
                                <SelectItem value="cloud">Cloud</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <Input id="provider" {...register('provider')} placeholder="e.g., AWS, DigitalOcean" />
                    </div>
                </div>
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Default Username</Label>
                        <Input id="username" {...register('username')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="basePath">Default Base Path</Label>
                        <Input id="basePath" {...register('basePath')} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Open Ports</Label>
                    {portFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <Input type="number" {...register(`portsOpen.${index}.value` as any)} placeholder="e.g., 80" />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removePort(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => appendPort({ value: '' } as any)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Port
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label>Used Ports</Label>
                     {usedPortFields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2">
                            <Input type="number" {...register(`usedPorts.${index}.port`)} placeholder="e.g., 8080" className="w-24" />
                            <Input {...register(`usedPorts.${index}.description`)} placeholder="e.g., Nginx for myapp.com" />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeUsedPort(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => appendUsedPort({ port: 0, description: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Used Port
                    </Button>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="is-private" checked={watch('isPrivate')} onCheckedChange={(checked) => setValue('isPrivate', checked)} />
                    <Label htmlFor="is-private">This is a private server</Label>
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
                    These fields are write-only. Click to reveal and update a credential.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Button type="button" variant={showPrivateIpField ? "secondary" : "outline"} onClick={() => toggleCredentialField('privateIp')}>
                        {showPrivateIpField ? 'Cancel Update' : 'Update Private IP'}
                    </Button>
                    {showPrivateIpField && (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="private-ip">New Private IP</Label>
                            <Input id="private-ip" {...register('privateIp')} placeholder="Enter new private IP address" />
                        </div>
                    )}
                </div>
                 <div className="space-y-2">
                    <Button type="button" variant={showPrivateKeyField ? "secondary" : "outline"} onClick={() => toggleCredentialField('privateKey')}>
                        {showPrivateKeyField ? 'Cancel Update' : 'Update Private Key'}
                    </Button>
                    {showPrivateKeyField && (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="private-key">New Private Key</Label>
                            <Textarea id="private-key" {...register('privateKey')} placeholder="Begins with -----BEGIN RSA PRIVATE KEY-----" rows={8} />
                        </div>
                    )}
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
