
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { getAllocation, updateAllocation } from '@/services/allocations';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  serverId: z.string().min(1, 'Server ID is required'),
  port: z.coerce.number().min(1024, 'Port must be 1024 or greater.'),
  allocatedStorage: z.coerce.number().min(1, 'Storage must be at least 1MB.'),
  status: z.enum(['active', 'inactive', 'pending', 'error']),
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
      assetId: '',
      serverId: '',
      port: 1024,
      allocatedStorage: 512,
      status: 'active',
    }
  });

  useEffect(() => {
    const fetchAllocation = async () => {
        setLoading(true);
        const result = await getAllocation(id);
        if (result.success && result.allocation) {
            form.reset(result.allocation);
        } else {
            setError(result.error || 'Failed to fetch allocation details.');
        }
        setLoading(false);
    }
    fetchAllocation();
  }, [id, form]);

  const handleUpdateAllocation = async (data: FormValues) => {
    const result = await updateAllocation(id, data);

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
          <Button variant="plain" asChild>
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
                  <FormField control={form.control} name="assetId" render={({ field }) => ( <FormItem><FormLabel>Asset ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="serverId" render={({ field }) => ( <FormItem><FormLabel>Server ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="port" render={({ field }) => ( <FormItem><FormLabel>Port</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="allocatedStorage" render={({ field }) => ( <FormItem><FormLabel>Allocated Storage (MB)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter>
              <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
