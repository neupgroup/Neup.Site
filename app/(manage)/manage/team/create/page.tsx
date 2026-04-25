
'use client';
import { createTeam } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/core/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePageTitle } from '@/core/hooks/use-page-title';

const formSchema = z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
    order: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTeamPage() {
    usePageTitle('Create Team');
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', description: '', order: 0 }
    });
    
    const onSubmit = async (data: FormValues) => {
        const result = await createTeam(data);
        if (result.success) {
            toast({ title: 'Team Created' });
            router.push('/manage/team');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    return (
        <div className="w-full max-w-2xl">
             <div className="mb-4">
                <Button variant="outline" asChild>
                    <Link href="/manage/team">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Teams
                    </Link>
                </Button>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Create New Team</CardTitle>
                            <CardDescription>
                                Create a new team or group.
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
                        <CardFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                Save Team
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
