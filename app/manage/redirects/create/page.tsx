
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useToast } from '#/core/hooks/useToast';
import { createRedirect } from '@/services/redirects';
import { useProfile } from '@/inapp/context/ProfileContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Input } from '#/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';

const formSchema = z.object({
  from: z.string().min(1, 'From path is required.').refine(p => p.startsWith('/'), "Path must start with a '/'"),
  to: z.string().min(1, 'Destination is required.').refine(val => val.startsWith('/') || /^(https?:\/\/)/.test(val), {
    message: 'Must be a relative path (starting with /) or a full URL (starting with http:// or https://).'
  }),
  type: z.enum(['temporary', 'permanent']),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateRedirectPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { asset } = useProfile();
  usePageTitle('Create Redirect');
  const displayDomain = asset?.domains?.production?.url || 'yourdomain.com';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: '/',
      to: '',
      type: 'permanent',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: FormValues) => {
    const result = await createRedirect(data);
    if (result.success) {
      toast({ title: 'Redirect Created' });
      router.push('/manage/redirects');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <LinkButton variant="plain" href="/manage/redirects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Redirects
          </LinkButton>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Create New Redirect</CardTitle>
              <CardDescription>
                Forward an incoming path to another URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <FormField control={form.control} name="from" render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm h-10">
                        {displayDomain}
                      </span>
                      <FormControl>
                        <Input {...field} placeholder="/old-page" className="rounded-l-none" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="to" render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl><Input {...field} placeholder="/new-page or https://example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="permanent">Permanent (301)</SelectItem>
                                <SelectItem value="temporary">Temporary (302)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="solid" htmlType="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                Save Redirect
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
