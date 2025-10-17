'use client';
import { useEffect, useState } from 'react';
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
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServerAllocation, updateServerAllocation } from '@/actions/allocations';
import { ServerAllocation } from '@/schemas/server';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type FormValues = Omit<ServerAllocation, 'id' | 'allocatedOn' | 'allocatedPorts'> & {
    allocatedPorts: { value: number }[];
};

export default function EditAllocationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<FormValues>({
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
    const fetchAllocation = async () => {
        setLoading(true);
        const result = await getServerAllocation(id);
        if (result.success && result.allocation) {
            reset({
                ...result.allocation,
                allocatedPorts: result.allocation.allocatedPorts?.map(p => ({ value: p })) || [],
            });
        } else {
            setError(result.error || 'Failed to fetch allocation details.');
        }
        setLoading(false);
    }
    fetchAllocation();
  }, [id, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocatedPorts',
  });
  
  const expiresOn = watch('expiresOn');

  const handleUpdateAllocation = async (data: FormValues) => {
    const ports = (data.allocatedPorts as { value: number }[])
        .map(p => p.value)
        .filter(p => p !== null && p !== undefined && !isNaN(p))
        .map(p => Number(p));

    const result = await updateServerAllocation(id, {...data, allocatedPorts: ports});

    if (result.success) {
      toast({ title: 'Allocation Updated!', description: `Successfully updated allocation.` });
      router.push(`/root/servers/allocations/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };
  
  if (loading) {
      return (
          <Card className="max-w-2xl">
              <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
          </Card>
      )
  }

  if (error) {
      return (
          <Alert variant="destructive" className="max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )
  }


  return (
    <form onSubmit={handleSubmit(handleUpdateAllocation)} className="w-full max-w-2xl space-y-6">
      <div className="mb-4">
        <Button variant="ghost" asChild>
            <Link href={`/root/servers/allocations/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Allocation
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Allocation</CardTitle>
          <CardDescription>Modify the deployment details for this site-server allocation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="siteId">Site ID</Label>
                    <Input id="siteId" {...register('siteId')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="serverId">Server ID</Label>
                    <Input id="serverId" {...register('serverId')} />
                </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input id="username" {...register('username')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="deploymentPath">Deployment Path (Optional)</Label>
                    <Input id="deploymentPath" {...register('deploymentPath')} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}