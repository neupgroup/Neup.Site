
'use client';

import { getJobPostingById, updateJobPosting, type JobPosting } from '@/services/hiring';
import { getApplicantsForJob, type Applicant } from '@/services/applicants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Pencil, Users, Save, X, Loader2, Plus, Trash2, Send, DollarSign, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState, use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/core/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/core/context/ProfileContext';
import { Checkbox } from '@/components/ui/checkbox';
import { usePageTitle } from '@/core/hooks/use-page-title';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const formSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  description: z.string().optional(),
  qualifications: z.array(z.object({
    value: z.string().min(1, 'Qualification cannot be empty.'),
  })),
  salary: z.string().optional(),
  openings: z.number().optional(),
});

const postingFormSchema = z.object({
    status: z.enum(['Draft', 'Open', 'Closed']),
});


type FormValues = z.infer<typeof formSchema>;
type PostingFormValues = z.infer<typeof postingFormSchema>;

function EditJobForm({ posting, onCancel, onSave }: { posting: JobPosting, onCancel: () => void, onSave: (data: FormValues) => Promise<void> }) {
    const [showSalaryField, setShowSalaryField] = useState(!!posting.salary);
    const [showOpeningsField, setShowOpeningsField] = useState(!!posting.openings);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: posting.title || '',
            location: posting.location || '',
            type: posting.type || 'Full-time',
            description: posting.description || '',
            qualifications: posting.qualifications?.map(q => ({ value: q })) || [],
            salary: posting.salary || '',
            openings: posting.openings || 1,
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
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
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-4">
                        {!showSalaryField && <Button type="button" variant="tertiary" size="sm" onClick={() => setShowSalaryField(true)}><DollarSign className="mr-2"/>Add Salary</Button>}
                        {showSalaryField && <FormField control={form.control} name="salary" render={({ field }) => (<FormItem><FormLabel>Salary</FormLabel><FormControl><Input {...field} placeholder="e.g., Competitive, NRs. 50,000/month" /></FormControl><FormMessage /></FormItem>)} />}

                        {!showOpeningsField && <Button type="button" variant="tertiary" size="sm" onClick={() => setShowOpeningsField(true)}><UserPlus className="mr-2"/>Add Number of Openings</Button>}
                        {showOpeningsField && <FormField control={form.control} name="openings" render={({ field }) => (<FormItem><FormLabel>Number of Openings</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />}
                    </div>

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
                                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div><FormMessage />
                                    </FormItem>
                                )} />
                            ))}
                            <Button type="button" variant="tertiary" className="w-full" onClick={() => append({ value: '' })}><Plus className="mr-2 h-4 w-4" /> Add Qualification</Button>
                        </div>
                    </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-6 pt-0">
                    <Button type="button" variant="plain" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function EditPostingForm({ posting, onCancel, onSave }: { posting: JobPosting, onCancel: () => void, onSave: (data: PostingFormValues) => Promise<void> }) {
    const { asset } = useProfile();
    const [promotionOption, setPromotionOption] = useState('none');
    const form = useForm<PostingFormValues>({
        resolver: zodResolver(postingFormSchema),
        defaultValues: {
            status: posting.status,
        },
    });

    const { isSubmitting } = form.formState;

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                <CardContent>
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                     <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">Placement</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg border p-3">
                                <Checkbox id="place-on-website" defaultChecked />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="place-on-website" className="font-medium cursor-pointer">
                                       {asset?.name || 'Your'}'s Website
                                    </label>
                                    <p className="text-sm text-muted-foreground">Post for free on your current website's careers page.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border p-3">
                                <Checkbox id="place-on-neup" />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="place-on-neup" className="font-medium cursor-pointer">
                                       Neup.Jobs
                                    </label>
                                    <p className="text-sm text-muted-foreground">Post on Neup.Jobs for free, with an option to boost for more visibility.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border p-3">
                                <Checkbox id="place-on-partners" />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="place-on-partners" className="font-medium cursor-pointer">
                                       Partner Platforms
                                    </label>
                                    <p className="text-sm text-muted-foreground">Based on the budget, Neup.Jobs may show across multiple partners.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                         <h3 className="font-semibold">Get More Applicants</h3>
                         <RadioGroup value={promotionOption} onValueChange={setPromotionOption} className="space-y-2">
                             <Label htmlFor="promo-flat" className="block cursor-pointer">
                                <Card className="has-[:checked]:border-primary">
                                    <CardHeader className="flex flex-row items-center gap-4 py-3">
                                    <RadioGroupItem value="flat" id="promo-flat" />
                                    <div>
                                        <h4 className="font-semibold text-sm">Pay a flat day charge</h4>
                                        <p className="text-xs text-muted-foreground">NRs. 20 per day. Boosted across Neup.Jobs.</p>
                                    </div>
                                    </CardHeader>
                                </Card>
                            </Label>
                            <Label htmlFor="promo-budget" className="block cursor-pointer">
                                <Card className="has-[:checked]:border-primary">
                                     <CardHeader className="flex flex-row items-center gap-4 py-3">
                                        <RadioGroupItem value="budget" id="promo-budget" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Pay your budget</h4>
                                            <p className="text-xs text-muted-foreground">Boosted across Neup.Jobs and partners.</p>
                                        </div>
                                     </CardHeader>
                                     {promotionOption === 'budget' && (
                                        <CardContent className="space-y-2 pl-12 pb-4">
                                            <Label htmlFor="more-budget">Promotional Budget (NRs.)</Label>
                                            <Input id="more-budget" type="number" placeholder="e.g., 5000" />
                                        </CardContent>
                                     )}
                                </Card>
                            </Label>
                         </RadioGroup>
                    </div>

                </CardContent>
                <div className="flex justify-end gap-2 px-6 pb-6">
                    <Button type="button" variant="plain" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        Save Posting
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default function ViewJobPostingPage({ params }: { params: { id: string } }) {
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingPosting, setIsEditingPosting] = useState(false);
  const { toast } = useToast();
  
  usePageTitle(posting ? `Job: ${posting.title}` : 'View Job');

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

  const handleSaveDetails = async (data: FormValues) => {
    if (!posting) return;
    const qualificationsArray = data.qualifications.map(q => q.value);
    const result = await updateJobPosting(posting.id, { ...data, qualifications: qualificationsArray });

    if (result.success) {
        await fetchJobData();
        setIsEditingDetails(false);
        toast({ title: "Job Posting Updated!" });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleSavePosting = async (data: PostingFormValues) => {
    if (!posting) return;
    const result = await updateJobPosting(posting.id, data);
    if (result.success) {
        await fetchJobData();
        setIsEditingPosting(false);
        toast({ title: 'Posting Status Updated' });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  if (loading) {
      return (
          <div className="w-full max-w-2xl mx-auto space-y-4">
              <Skeleton className="h-8 w-40" />
              <Card><CardHeader><Skeleton className="h-40 w-full" /></CardHeader></Card>
              <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
          </div>
      );
  }

  if (error || !posting) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <Button variant="tertiary" asChild><Link href="/manage/hiring"><ArrowLeft className="mr-2 h-4 w-4" />Back to Hiring</Link></Button>
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Job posting not found'}</AlertDescription></Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="mb-4">
        <Button variant="tertiary" asChild><Link href="/manage/hiring"><ArrowLeft className="mr-2 h-4 w-4" />Back to Hiring</Link></Button>
      </div>

      <div className="space-y-6">
        <Card>
          {isEditingDetails ? (
            <EditJobForm posting={posting} onCancel={() => setIsEditingDetails(false)} onSave={handleSaveDetails} />
          ) : (
            <>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{posting.title}</CardTitle>
                            <CardDescription className="mt-2 flex items-center flex-wrap gap-2">
                               <Badge variant="secondary">{posting.location}</Badge>
                               <Badge variant="secondary">{posting.type}</Badge>
                               {posting.salary && <Badge variant="outline">{posting.salary}</Badge>}
                               {posting.openings && <Badge variant="outline">{posting.openings} opening(s)</Badge>}
                            </CardDescription>
                        </div>
                        <Button variant="tertiary" onClick={() => setIsEditingDetails(true)}>
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
            {isEditingPosting ? (
                <EditPostingForm posting={posting} onCancel={() => setIsEditingPosting(false)} onSave={handleSavePosting} />
            ) : (
                <>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle>Posting & Visibility</CardTitle>
                         <Button variant="tertiary" size="sm" onClick={() => setIsEditingPosting(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm">Status</h4>
                        <Badge variant={posting.status === 'Open' ? 'default' : 'secondary'}>{posting.status}</Badge>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Placement</h4>
                        <p className="text-sm text-muted-foreground">Currently posting to: <strong>Company Website</strong></p>
                    </div>
                </CardContent>
                </>
            )}
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">Applicants<Button asChild variant="tertiary" size="sm"><Link href={`/manage/hiring/${params.id}/applicants`}>View All</Link></Button></CardTitle>
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
