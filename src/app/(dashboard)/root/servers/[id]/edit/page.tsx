
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
import { Save, ArrowLeft, Loader2, AlertCircle, KeyRound, Plus, Trash2, Server as ServerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServer, updateServer, type Server } from '@/actions/servers';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type FormValues = Omit<Server, 'id' | 'createdAt'>;

export default function EditServerPage({ params }: { params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, watch, formState: { isSubmitting }, reset } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '', // This will not be populated from the server
      type: 'private',
      allocations: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocations'
  });

  const serverType = watch('type');

  useEffect(() => {
    const fetchServer = async () => {
      setLoading(true);
      const result = await getServer(id);
      if (result.success && result.server) {
        reset({
          name: result.server.name,
          publicIp: result.server.publicIp,
          privateIp: result.server.privateIp || '',
          privateKey: '', // Keep private key field blank for security
          type: result.server.type || 'private',
          allocations: result.server.allocations || [],
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
             <div className="space-y-3">
                <Label>Server Type</Label>
                <RadioGroup {...register('type')} value={serverType} onValueChange={(value) => register('type').onChange({target: {value}})} className="grid grid-cols-2 gap-4">
                     <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", serverType === 'private' && "border-primary")}>
                        <RadioGroupItem value="private" className="sr-only" />
                        <ServerIcon className="mb-3 h-6 w-6" />
                        Private
                    </Label>
                     <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", serverType === 'shared' && "border-primary")}>
                        <RadioGroupItem value="shared" className="sr-only" />
                        <ServerIcon className="mb-3 h-6 w-6" />
                        Shared
                    </Label>
                </RadioGroup>
            </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Site Allocations</CardTitle>
              <CardDescription>Assign sites to this server. A port is required for 'shared' servers to avoid conflicts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <div className="space-y-1">
                          {index === 0 && <Label>Site ID</Label>}
                          <Input {...register(`allocations.${index}.siteId`)} placeholder="e.g., my-awesome-site" />
                      </div>
                      <div className="space-y-1">
                         {index === 0 && <Label>Port <span className="text-xs text-muted-foreground">(for shared)</span></Label>}
                          <Input type="number" {...register(`allocations.${index}.port`, { valueAsNumber: true })} placeholder="e.g., 3001" />
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
               <Button type="button" variant="outline" className="w-full" onClick={() => append({ siteId: '', port: 0 })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Allocation
              </Button>
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

      <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm mt-6">
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

    </form>
  );
}
