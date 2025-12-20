
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSite, type Site } from '@/actions/editor/site';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';

export const DomainSettingsSchema = z.object({
    domains: z.object({
        production: z.object({
            url: z.string().optional(),
            forceHttps: z.boolean().optional(),
        }).optional(),
        development: z.object({
            url: z.string().optional(),
            forceHttps: z.boolean().optional(),
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
            domains: {
                production: { url: '', forceHttps: true },
                development: { url: '', forceHttps: false },
            },
        },
    });

    useEffect(() => {
        if (!loading && site) {
            form.reset({
                domains: {
                    production: {
                        url: site.domains?.production?.url || '',
                        forceHttps: site.domains?.production?.forceHttps ?? true
                    },
                    development: {
                        url: site.domains?.development?.url || '',
                        forceHttps: site.domains?.development?.forceHttps ?? false
                    },
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
                    domains: {
                        ...site.domains,
                        ...data.domains
                    },
                });
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold font-headline">Domains</h1>
                    <p className="text-muted-foreground">Manage your site's domains and redirection rules.</p>
                </header>

                <div className="space-y-6">
                    {/* Production Domain */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Production Domain</h3>
                        <FormField
                            control={form.control}
                            name="domains.production.url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain URL</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g., yourdomain.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="domains.production.forceHttps"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Force HTTPS</FormLabel>
                                        <FormDescription>
                                            Redirect all HTTP requests to HTTPS
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Development Domain */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Development Domain</h3>
                        <FormField
                            control={form.control}
                            name="domains.development.url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain URL</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g., dev.yourdomain.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="domains.development.forceHttps"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Force HTTPS</FormLabel>
                                        <FormDescription>
                                            Redirect all HTTP requests to HTTPS
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>


                <div className="px-0">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        Save All Settings
                    </Button>
                </div>
            </form>
        </Form>
    );
}
