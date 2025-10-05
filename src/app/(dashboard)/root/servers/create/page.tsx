
'use client';
import { useState } from 'react';
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
import { Save, ArrowLeft, Loader2, Plus, Trash2, Server as ServerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createServer } from '@/actions/servers';
import Link from 'next/link';
import { Server } from '@/schemas/server';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type FormValues = Omit<Server, 'id' | 'createdAt'>;

export default function CreateServerPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '',
      type: 'private',
      allocations: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocations'
  });

  const serverType = watch('type');

  const handleCreateServer = async (data: FormValues) => {
    if (!data.name || !data.publicIp || !data.privateKey) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name, Public IP, and Private Key are required.' });
      return;
    }
    
    const result = await createServer(data);

    if (result.success) {
      toast({ title: 'Server Created!', description: `Successfully created ${data.name}.` });
      router.push('/root/servers');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleCreateServer)} className="w-full max-w-2xl space-y-6">
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
          <CardTitle>Create New Server</CardTitle>
          <CardDescription>Enter the details for the new server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input id="server-name" {...register('name')} placeholder="e.g., My Production Server" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="public-ip">Public IP</Label>
                    <Input id="public-ip" {...register('publicIp')} placeholder="e.g., 203.0.113.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="private-ip">Private IP (Optional)</Label>
                    <Input id="private-ip" {...register('privateIp')} placeholder="e.g., 10.0.0.1" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="private-key">Private Key</Label>
                <Textarea id="private-key" {...register('privateKey')} placeholder="Begins with -----BEGIN RSA PRIVATE KEY-----" rows={8} />
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
      
      {serverType === 'shared' && (
        <Card>
            <CardHeader>
                <CardTitle>Site Allocations</CardTitle>
                <CardDescription>Assign specific Site IDs to ports on this shared server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                        <div className="space-y-1">
                            <Label>Site ID</Label>
                            <Input {...register(`allocations.${index}.siteId`)} placeholder="e.g., my-awesome-site" />
                        </div>
                        <div className="space-y-1">
                            <Label>Port</Label>
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
      )}

      <CardFooter>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Creating...' : 'Create Server'}
        </Button>
      </CardFooter>
    </form>
  );
}
