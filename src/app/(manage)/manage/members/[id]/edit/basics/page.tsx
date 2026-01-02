
'use client';

import { getMember, updateMember, deleteMember } from '@/actions/members';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePageTitle } from '@/hooks/use-page-title';

const formSchema = z.object({
    name: z.string().min(1, 'Member name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Role is required'),
    imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMemberBasicsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    usePageTitle('Edit Member');
    const router = useRouter();
    const { toast } = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        getMember(id).then(({ member, error }) => {
            if (error || !member) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch member data.'});
                router.push('/manage/members');
            } else {
                form.reset({
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    imageUrl: member.imageUrl,
                });
            }
        });
    }, [id, form, router, toast]);
    
    const onSubmit = async (data: FormValues) => {
        const result = await updateMember(id, data);
        if (result.success) {
            toast({ title: 'Member Updated' });
            router.push(`/manage/members/${id}`);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        const result = await deleteMember(id);
        if (result.success) {
            toast({ title: 'Member Deleted'});
            router.push('/manage/members');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    }

    return (
         <>
            <div className="w-full max-w-2xl">
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href={`/manage/members/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Member
                        </Link>
                    </Button>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Member</CardTitle>
                                <CardDescription>
                                    Update the details for this team member.
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
                                    <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                    <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                             <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="mr-2"/> Delete Member
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
             <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this member. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
