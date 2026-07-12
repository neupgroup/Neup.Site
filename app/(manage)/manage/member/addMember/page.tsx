'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/core/hooks/use-toast';
import { usePageTitle } from '@/core/hooks/use-page-title';
import type { Team } from '@/schemas/team';
import { createMember } from '@/services/members';
import { getTeams } from '@/services/teams';

/*
::neup.documentation::manage-member-add-member-page

::public

Dedicated page for creating a member from `/manage/member`.

::public end
::end
*/

const formSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  teamId: z.string().min(1, 'Select a team'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddMemberPage() {
  usePageTitle('Add Member');
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      imageUrl: '',
      teamId: '',
    },
  });

  useEffect(() => {
    const loadTeams = async () => {
      const result = await getTeams();
      if (!result.success || !result.teams) {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to load teams.' });
        setLoadingTeams(false);
        return;
      }

      setTeams(result.teams);
      setLoadingTeams(false);
    };

    loadTeams();
  }, [toast]);

  const onSubmit = async (values: FormValues) => {
    const result = await createMember({
      name: values.name,
      email: values.email,
      role: values.role,
      imageUrl: values.imageUrl || undefined,
      teamId: values.teamId,
    });

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      return;
    }

    toast({ title: 'Member Created' });
    router.push('/manage/member');
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/manage/member">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Member</CardTitle>
              <CardDescription>Create a member on its own page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g., Designer" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://example.com/photo.jpg" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <div className="space-y-3 rounded-md border p-4">
                      {loadingTeams ? (
                        <p className="text-sm text-muted-foreground">Loading teams...</p>
                      ) : teams.length ? (
                        <>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
                            <Link href="/manage/member/addTeam" target="_blank" rel="noreferrer">
                              Add a new team as well
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Create a team first before adding a member.</p>
                          <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
                            <Link href="/manage/member/addTeam" target="_blank" rel="noreferrer">
                              Add a new team as well
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || loadingTeams || !teams.length}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                Add Member
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
