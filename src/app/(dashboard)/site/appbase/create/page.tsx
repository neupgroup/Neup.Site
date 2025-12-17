
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

const formSchema = z.object({
  fileName: z.string().min(1, 'Filename is required').refine(name => name.endsWith('.json'), 'Filename must end with .json'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAppBaseFilePage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fileName: '' },
  });

  const onSubmit = async (data: FormValues) => {
    const serverResult = await getSiteServers();
    if (!serverResult.success || !serverResult.servers || serverResult.servers.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No server allocated to this site.' });
      return;
    }
    const serverId = serverResult.servers[0].id;
    
    const result = await createAppBaseFile(serverId, data.fileName);
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
              <CardDescription>Create a new JSON file in the app's base directory.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="fileName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Filename</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., config.json" />
                  </FormControl>
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
