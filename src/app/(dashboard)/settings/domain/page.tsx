
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSite, type Site } from '@/actions/editor/site';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/use-page-title';

const ProxySchema = z.object({
    path: z.string().min(1, 'Path is required').refine(p => p.startsWith('/'), 'Path must start with /'),
    ip: z.string().min(1, 'IP is required'),
    port: z.string().min(1, 'Port is required'),
});

export const DomainSettingsSchema = z.object({
    domains: z.object({
        production: z.object({
            url: z.string().optional(),
            forceHttps: z.boolean().optional(),
            proxies: z.array(ProxySchema).optional(),
        }).optional(),
        development: z.object({
            url: z.string().optional(),
            forceHttps: z.boolean().optional(),
            proxies: z.array(ProxySchema).optional(),
        }).optional(),
    }).optional(),
});

export type DomainFormData = z.infer<typeof DomainSettingsSchema>;

const ProxyFields = ({ nestIndex, control }: { nestIndex: "domains.production.proxies" | "domains.development.proxies", control: any }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: nestIndex
    });

    return (
        <div className="space-y-4 pt-4">
            <h4 className="font-semibold text-sm">Reverse Proxy Rules</h4>
            {fields.map((item, k) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end p-3 border rounded-md">
                     <FormField
                        control={control}
                        name={`${nestIndex}.${k}.path`}
                        render={({ field }) => (
                            <FormItem><FormLabel>Path</FormLabel><FormControl><Input {...field} placeholder="/api" /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`${nestIndex}.${k}.ip`}
                        render={({ field }) => (
                            <FormItem><FormLabel>Target IP</FormLabel><FormControl><Input {...field} placeholder="e.g., 192.168.1.10" /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`${nestIndex}.${k}.port`}
                        render={({ field }) => (
                            <FormItem><FormLabel>Target Port</FormLabel><FormControl><Input {...field} placeholder="e.g., 8080" /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(k)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ path: '', ip: '', port: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Proxy Rule
            </Button>
        </div>
    );
};

export default function DomainPage() {
    const { site, setSite, loading } = useProfile();
    const { toast } = useToast();
    usePageTitle('Domain Settings');

    const form = useForm<DomainFormData>({
        resolver: zodResolver(DomainSettingsSchema),
        defaultValues: {
            domains: {
                production: { url: '', forceHttps: true, proxies: [] },
                development: { url: '', forceHttps: false, proxies: [] },
            },
        },
    });

    useEffect(() => {
        if (!loading && site) {
            form.reset({
                domains: {
                    production: {
                        url: site.domains?.production?.url || '',
                        forceHttps: site.domains?.production?.forceHttps ?? true,
                        proxies: site.domains?.production?.proxies || [],
                    },
                    development: {
                        url: site.domains?.development?.url || '',
                        forceHttps: site.domains?.development?.forceHttps ?? false,
                        proxies: site.domains?.development?.proxies || [],
                    },
                },
            });
        }
    }, [loading, site, form]);

    const onSubmit = async (data: DomainFormData) => {
        const result = await saveSite(data);

        if (result.success && result.id) {
            toast({ title: 'Settings Saved', description: 'Your domain and proxy settings have been updated.' });
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
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold font-headline">Domains and Proxy</h1>
                    <p className="text-muted-foreground">Manage your site's domains and reverse proxy rules.</p>
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
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Force HTTPS</FormLabel>
                                        <FormDescription>Redirect all HTTP requests to HTTPS</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <ProxyFields nestIndex="domains.production.proxies" control={form.control} />
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
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Force HTTPS</FormLabel>
                                        <FormDescription>Redirect all HTTP requests to HTTPS</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <ProxyFields nestIndex="domains.development.proxies" control={form.control} />
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
