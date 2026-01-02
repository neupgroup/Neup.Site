

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAppBaseFile } from '@/actions/app-base';
import { getSiteServers } from '@/actions/servers';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePageTitle } from '@/hooks/use-page-title';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  type: z.enum(['internal', 'external']),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAppBaseFilePage() {
  usePageTitle('Create App Base File');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', type: 'external' },
  });

  const onSubmit = async (data: FormValues) => {
    const serverResult = await getSiteServers();
    if (!serverResult.success || !serverResult.servers || serverResult.servers.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No server allocated to this site.' });
      return;
    }
    const serverId = serverResult.servers[0].id;

    const result = await createAppBaseFile(serverId, data.name, data.type);
    if (result.success) {
      toast({ title: 'File Created' });
      router.push('/site/appbase');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/site/appbase">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App Base
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Create New File</CardTitle>
              <CardDescription>Create a new JSON file in the app's base directory. The .json extension will be added automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., config" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>File Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">Internal (`/src/base`)</SelectItem>
                      <SelectItem value="external">External (`/base`)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Create File
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
