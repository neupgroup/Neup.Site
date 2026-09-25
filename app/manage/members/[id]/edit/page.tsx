'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@neup/components/ui/form';
import { Input } from '@neup/components/ui/input';
import { useToast } from '@neup/core/hooks/useToast';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import { appendProject } from '@/inapp/helpers/application-mode';
import { getMember, updateMember } from '@/services/members';

const formSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  usePageTitle('Edit Member');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const project = searchParams.get('project');
  const [memberId, setMemberId] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', role: '', imageUrl: '' },
  });

  useEffect(() => {
    let active = true;
    params.then(async ({ id }) => {
      setMemberId(id);
      const result = await getMember(id);
      if (!active) return;
      if (!result.success || !result.member) {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Member not found.' });
        return;
      }
      form.reset({
        name: result.member.name,
        email: result.member.email,
        role: result.member.role,
        imageUrl: result.member.imageUrl || '',
      });
    });
    return () => { active = false; };
  }, [form, params, toast]);

  const onSubmit = async (values: FormValues) => {
    const { id } = await params;
    const result = await updateMember(id, { ...values, imageUrl: values.imageUrl || undefined });
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      return;
    }
    toast({ title: 'Member Updated' });
    router.push(appendProject(`/manage/members/${id}`, project));
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <LinkButton variant="outlined" href={memberId ? appendProject(`/manage/members/${memberId}`, project) : '#'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Member
        </LinkButton>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Member</CardTitle>
              <CardDescription>Update this member's profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button variant="solid" htmlType="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
