'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createServerAllocation } from '@/actions/allocations';
import { ServerAllocation } from '@/schemas/server';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type FormValues = Omit<ServerAllocation, 'id' | 'allocatedOn' | 'allocatedPorts'> & {
    allocatedPorts: { value: number }[];
};

export default function CreateAllocationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverIdFromQuery = searchParams.get('serverId');

  const { register, control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      siteId: '',
      serverId: '',
      username: '',
      deploymentPath: '',
      allocatedPorts: [],
      expiresOn: null,
    }
  });
  
  useEffect(() => {
    if (serverIdFromQuery) {
      setValue('serverId', serverIdFromQuery);
    }
  }, [serverIdFromQuery, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocatedPorts',
  });
  
  const expiresOn = watch('expiresOn');

  const handleCreateAllocation = async (data: FormValues) => {
    // Convert allocatedPorts to an array of numbers
    const ports = (data.allocatedPorts as { value: number }[])
        .map(p => p.value)
        .filter(p => p !== null && p !== undefined && !isNaN(p))
        .map(p => Number(p));

    const result = await createServerAllocation({...data, allocatedPorts: ports});

    if (result.success) {
      toast({ title: 'Allocation Created!', description: `Successfully allocated server.` });
      router.push('/root/servers/allocations');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleCreateAllocation)} className="w-full max-w-2xl space-y-6">
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
          <CardTitle>Create New Allocation</CardTitle>
          <CardDescription>Assign a site to a server with specific deployment details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="siteId">Site ID</Label>
                    <Input id="siteId" {...register('siteId')} placeholder="e.g., my-awesome-site" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="serverId">Server ID</Label>
                    <Input id="serverId" {...register('serverId')} placeholder="e.g., srv_123abc" />
                </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input id="username" {...register('username')} placeholder="e.g., ubuntu" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="deploymentPath">Deployment Path (Optional)</Label>
                    <Input id="deploymentPath" {...register('deploymentPath')} placeholder="e.g., /home/ubuntu/app" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Allocated Ports</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                      <Input type="number" {...register(`allocatedPorts.${index}.value` as const, { valueAsNumber: true })} />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
               <Button type="button" variant="outline" className="w-full" onClick={() => append({ value: 0 })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Port
              </Button>
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
        <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Creating...' : 'Create Allocation'}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}