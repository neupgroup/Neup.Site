'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { useToast } from '#/core/hooks/useToast';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';
import { createTeam } from '@/services/teams';

/*
::neup.documentation::manage-member-add-team-page

::public

Dedicated page for creating a team from `/manage/member`.

::public end
::end
*/

const formSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddTeamPage() {
  usePageTitle('Add Team');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const selectedProject = searchParams.get('selectedProject');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await createTeam({
      name: values.name,
      description: values.description?.trim() || undefined,
    });

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      return;
    }

    toast({ title: 'Team Created' });
    router.push(appendSelectedProject('/manage/member', selectedProject));
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="tertiary" asChild>
          <Link href={appendSelectedProject('/manage/member', selectedProject)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Team</CardTitle>
              <CardDescription>Create a team on its own page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                Save Team
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
