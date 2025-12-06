
'use client';
import { createMember } from '@/actions/members';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
    name: z.string().min(1, 'Member name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Role is required'),
    imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddMemberPage() {
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', role: '', imageUrl: '' }
    });
    
    const onSubmit = async (data: FormValues) => {
        const result = await createMember(data);
        if (result.success) {
            toast({ title: 'Member Created' });
            router.push('/manage/members');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    return (
        <div className="w-full max-w-2xl">
             <div className="mb-4">
                <Button variant="outline" asChild>
                    <Link href="/manage/members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members
                    </Link>
                </Button>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Add New Member</CardTitle>
                            <CardDescription>
                                Add a new member to your organization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} placeholder="e.g., Software Engineer" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/photo.jpg" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                Add Member
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
