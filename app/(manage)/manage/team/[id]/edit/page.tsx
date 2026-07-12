
'use client';

import { getTeam, updateTeam, deleteTeam } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/core/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePageTitle } from '@/core/hooks/use-page-title';

/*
::neup.documentation::manage-team-edit-page

::public

Edit page for an existing team record.

It returns the user to the `/manage/member` landing page when the team cannot
be loaded or after the team is deleted.

::public end
::end
*/

const formSchema = z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
    order: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    usePageTitle('Edit Team');
    const router = useRouter();
    const { toast } = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        getTeam(id).then(({ team, error }) => {
            if (error || !team) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch team data.'});
                router.push('/manage/member');
            } else {
                form.reset({
                    name: team.name,
                    description: team.description,
                    order: team.order,
                });
            }
        });
    }, [id, form, router, toast]);
    
    const onSubmit = async (data: FormValues) => {
        const result = await updateTeam(id, data);
        if (result.success) {
            toast({ title: 'Team Updated' });
            router.push(`/manage/team/${id}`);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        const result = await deleteTeam(id);
        if (result.success) {
            toast({ title: 'Team Deleted'});
            router.push('/manage/member');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    }

    return (
         <>
            <div className="w-full max-w-2xl">
                <div className="mb-4">
                    <Button variant="tertiary" asChild>
                        <Link href={`/manage/team/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Team
                        </Link>
                    </Button>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Team</CardTitle>
                                <CardDescription>
                                    Update the details for this team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Team Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="order" render={({ field }) => (
                                    <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                             <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="mr-2"/> Delete Team
                            </Button>
                            <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
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
                            This will permanently delete the team. This action cannot be undone.
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
