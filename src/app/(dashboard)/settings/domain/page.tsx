
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSite, type Site } from '@/actions/editor/site';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';

export const DomainSettingsSchema = z.object({
  domainSettings: z.object({
    production: z.object({
      url: z.string().optional(),
    }).optional(),
    staging: z.object({
      url: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type DomainFormData = z.infer<typeof DomainSettingsSchema>;

export default function DomainPage() {
    const { site, setSite, loading } = useProfile();
    const { toast } = useToast();

    const form = useForm<DomainFormData>({
        resolver: zodResolver(DomainSettingsSchema),
        defaultValues: {
            domainSettings: {
                production: { url: '' },
                staging: { url: '' },
            },
        },
    });

    useEffect(() => {
        if (!loading && site) {
            form.reset({
                domainSettings: {
                    production: { url: site.domainSettings?.production?.url || '' },
                    staging: { url: site.domainSettings?.staging?.url || '' },
                },
            });
        }
    }, [loading, site, form]);

    const onSubmit = async (data: DomainFormData) => {
        const result = await saveSite(data);

        if (result.success && result.id) {
            toast({ title: 'Domains Saved', description: 'Your domain settings have been updated.' });
            if (site) {
                 setSite({
                    ...site,
                    domainSettings: {
                        ...site.domainSettings,
                        ...data.domainSettings
                    },
                });
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold font-headline">Domains</h1>
                    <p className="text-muted-foreground">Manage your site's domains and redirection rules.</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Connected Domains</CardTitle>
                        <CardDescription>Assign domains for your production and testing environments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="domainSettings.production.url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain for your Website</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g., yourdomain.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="domainSettings.staging.url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain for your Testing Site</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g., staging.yourdomain.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>


                <CardFooter className="px-0">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        Save All Settings
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
