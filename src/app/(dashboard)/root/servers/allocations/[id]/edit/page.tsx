
'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServerAllocation, updateServerAllocation } from '@/actions/allocations';
import Link from 'next/link';
import { ServerAllocation } from '@/schemas/server';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  serverId: z.string().min(1, 'Server ID is required'),
  username: z.string().optional(),
  deploymentPath: z.string().optional(),
  storageAllocation: z.string().min(1, 'Storage allocation is required.'),
  allocatedPorts: z.array(z.object({ value: z.string() })).optional(),
  expiresOn: z.string().nullable().optional(),
});


type FormValues = z.infer<typeof formSchema>;

export default function EditAllocationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteId: '',
      serverId: '',
      username: '',
      deploymentPath: '',
      storageAllocation: '',
      allocatedPorts: [],
      expiresOn: null,
    }
  });

  useEffect(() => {
    const fetchAllocation = async () => {
        setLoading(true);
        const result = await getServerAllocation(id);
        if (result.success && result.allocation) {
            form.reset({
                ...result.allocation,
                allocatedPorts: result.allocation.allocatedPorts?.map(p => ({ value: String(p) })),
            });
        } else {
            setError(result.error || 'Failed to fetch allocation details.');
        }
        setLoading(false);
    }
    fetchAllocation();
  }, [id, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allocatedPorts'
  });
  
  const expiresOn = form.watch('expiresOn');

  const handleUpdateAllocation = async (data: FormValues) => {
    const ports = data.allocatedPorts?.map(p => Number(p.value)).filter(p => !isNaN(p));
    
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUpdateAllocation)} className="w-full max-w-2xl space-y-6">
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
                  <FormField control={form.control} name="siteId" render={({ field }) => ( <FormItem><FormLabel>Site ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="serverId" render={({ field }) => ( <FormItem><FormLabel>Server ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Username (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="deploymentPath" render={({ field }) => ( <FormItem><FormLabel>Deployment Path (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField
                control={form.control}
                name="storageAllocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Allocation (MB)</FormLabel>
                    <FormControl><Input type="number" {...field} placeholder="e.g., 1024" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                  <FormLabel>Allocated Ports</FormLabel>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`allocatedPorts.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={() => append({ value: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Port
                </Button>
              </div>
              <FormField
                control={form.control}
                name="expiresOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires On</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString() || null)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                     <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
