
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
} from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { createAllocation } from '@/services/allocations';
import Link from 'next/link';

const formSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  serverId: z.string().min(1, 'Server ID is required'),
  port: z.coerce.number().min(1024, 'Port must be 1024 or greater.'),
  allocatedStorage: z.coerce.number().min(1, 'Storage must be at least 1MB.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAllocationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverIdFromQuery = searchParams.get('serverId');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      serverId: serverIdFromQuery || '',
      port: 1024,
      allocatedStorage: 512,
    }
  });

  const handleCreateAllocation = async (data: FormValues) => {
    const result = await createAllocation(data);

    if (result.success) {
      toast({ title: 'Allocation Created!', description: `Successfully allocated server.` });
      router.push('/root/servers/allocations');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCreateAllocation)} className="w-full max-w-2xl space-y-6">
        <div className="mb-4">
          <Button type="plain" asChild>
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
                  <FormField control={form.control} name="assetId" render={({ field }) => ( <FormItem><FormLabel>Asset ID</FormLabel><FormControl><Input {...field} placeholder="e.g., my-awesome-site" /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="serverId" render={({ field }) => ( <FormItem><FormLabel>Server ID</FormLabel><FormControl><Input {...field} placeholder="e.g., srv_123abc" /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <FormField control={form.control} name="port" render={({ field }) => ( <FormItem><FormLabel>Port</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="allocatedStorage" render={({ field }) => ( <FormItem><FormLabel>Allocated Storage (MB)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
          </CardContent>
          <CardFooter>
              <Button type="solid" htmlType="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Allocation'}
              </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
