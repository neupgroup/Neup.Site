'use client';

import { getJobPostingById, updateJobPosting, type JobPosting } from '@/services/hiring';
import { getApplicantsForJob, type Applicant } from '@/services/applicants';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { AlertCircle, ArrowLeft, Pencil, Users, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '#/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { use, useEffect, useState } from 'react';
import { Skeleton } from '#/components/ui/skeleton';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';
import { Textarea } from '#/components/ui/textarea';
import { useToast } from '#/core/hooks/useToast';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const formSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  status: z.enum(['Draft', 'Open', 'Closed']),
  description: z.string().optional(),
  qualifications: z.array(z.object({
    value: z.string().min(1, 'Qualification cannot be empty.'),
  })),
});

type FormValues = z.infer<typeof formSchema>;

function EditJobForm({ posting, onCancel, onSave }: { posting: JobPosting, onCancel: () => void, onSave: (data: FormValues) => Promise<void> }) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: posting.title,
            location: posting.location,
            type: posting.type,
            status: posting.status,
            description: posting.description,
            qualifications: posting.qualifications?.map(q => ({ value: q })) || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'qualifications',
    });

    const { isSubmitting } = form.formState;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                <CardHeader>
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem><FormLabel>Job Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Internship">Internship</SelectItem></SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem><FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea {...field} rows={8} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div>
                        <h3 className="font-semibold mb-2">Qualifications</h3>
                        <div className="space-y-2">
                             {fields.map((field, index) => (
                                <FormField key={field.id} control={form.control} name={`qualifications.${index}.value`} render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormControl><Input {...field} /></FormControl>
                                            <Button htmlType="button" variant="solid" convey="danger" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div><FormMessage />
                                    </FormItem>
                                )} />
                            ))}
                            <Button htmlType="button" variant="outlined" className="w-full" onClick={() => append({ value: '' })}><Plus className="mr-2 h-4 w-4" /> Add Qualification</Button>
                        </div>
                    </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-6 pt-0">
                    <Button htmlType="button" variant="plain" onClick={onCancel}>Cancel</Button>
                    <Button variant="solid" htmlType="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default function ViewJobPostingPage({ params }: { params: { id: string } }) {
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchJobData = async () => {
    setLoading(true);
    const [postingResult, applicantsResult] = await Promise.all([
      getJobPostingById(params.id),
      getApplicantsForJob(params.id)
    ]);
    
    if (postingResult.error || !postingResult.posting) {
      setError(postingResult.error || 'Job posting not found');
    } else {
      setPosting(postingResult.posting);
    }
    
    if (applicantsResult.success) {
      setApplicants(applicantsResult.applicants || []);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    fetchJobData();
  }, [params.id]);

  const handleSave = async (data: FormValues) => {
    if (!posting) return;
    const qualificationsArray = data.qualifications.map(q => q.value);
    const result = await updateJobPosting(posting.id, { ...data, qualifications: qualificationsArray });

    if (result.success) {
        await fetchJobData(); // Refetch data to show updated view
        setIsEditing(false);
        toast({ title: "Job Posting Updated!" });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  if (loading) {
      return (
          <div className="w-full max-w-4xl mx-auto space-y-4">
              <Skeleton className="h-8 w-40" />
              <Card><CardHeader><Skeleton className="h-40 w-full" /></CardHeader></Card>
              <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
          </div>
      );
  }

  if (error || !posting) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <LinkButton variant="plain" href="/manage/hiring"><ArrowLeft className="mr-2 h-4 w-4" />Back to Hiring</LinkButton>
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Job posting not found'}</AlertDescription></Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="mb-4">
        <LinkButton variant="plain" href="/manage/hiring"><ArrowLeft className="mr-2 h-4 w-4" />Back to Hiring</LinkButton>
      </div>

      <div className="space-y-6">
        <Card>
          {isEditing ? (
            <EditJobForm posting={posting} onCancel={() => setIsEditing(false)} onSave={handleSave} />
          ) : (
            <>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{posting.title}</CardTitle>
                            <CardDescription className="mt-2 flex items-center gap-2">
                               <Badge variant="secondary">{posting.location}</Badge>
                               <Badge variant="secondary">{posting.type}</Badge>
                               <Badge variant={posting.status === 'Open' ? 'default' : 'secondary'}>{posting.status}</Badge>
                            </CardDescription>
                        </div>
                        <Button variant="outlined" onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Job Description</h3>
                        <div className="prose dark:prose-invert max-w-none text-sm"><p>{posting.description || 'No description provided.'}</p></div>
                    </div>
                    {posting.qualifications && posting.qualifications.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Qualifications</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">{posting.qualifications.map((q, i) => <li key={i}>{q}</li>)}</ul>
                        </div>
                    )}
                </CardContent>
            </>
          )}
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">Applicants<LinkButton variant="outlined" size="sm" href={`/manage/hiring/${params.id}>View All</LinkButton></CardTitle>
            </CardHeader>
            <CardContent>
                {applicants && applicants.length > 0 ? (
                    <div className="space-y-4">{applicants.slice(0, 5).map(applicant => (<div key={applicant.id} className="flex items-center gap-3"><Avatar><AvatarFallback>{getInitials(applicant.name)}</AvatarFallback></Avatar><div><p className="font-medium text-sm">{applicant.name}</p><p className="text-xs text-muted-foreground">{applicant.email}</p></div></div>))}</div>
                ) : (<div className="text-center text-muted-foreground py-8"><Users className="mx-auto h-8 w-8 mb-2"/><p className="text-sm">No applicants yet.</p></div>)}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}