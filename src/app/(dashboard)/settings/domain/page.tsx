
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSite, type Site } from '@/actions/editor/site';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const domainSchema = z.object({
    value: z.string().min(1, 'Domain is required.').refine(val => {
        const pattern = /^[a-zA-Z0-9.-]+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        return pattern.test(val);
    }, 'Invalid domain or path format.'),
});

export const DomainFormSchema = z.object({
  domains: z.array(domainSchema).optional(),
  domainSettings: z.object({
      forceHttps: z.boolean().default(true),
      redirectToNonWww: z.boolean().default(true),
  }).optional(),
});

export type DomainFormData = z.infer<typeof DomainFormSchema>;

export default function DomainPage() {
    const { site, setSite, loading } = useProfile();
    const { toast } = useToast();

    const form = useForm<DomainFormData>({
        resolver: zodResolver(DomainFormSchema),
        defaultValues: {
            domains: [],
            domainSettings: {
                forceHttps: true,
                redirectToNonWww: true,
            }
        },
    });

    const { fields: domainFields, append: appendDomain, remove: removeDomain } = useFieldArray({
        control: form.control,
        name: 'domains',
    });

    useEffect(() => {
        if (loading) return;

        if (site) {
            form.reset({
                domains: site.domains || [],
                domainSettings: site.domainSettings || { forceHttps: true, redirectToNonWww: true },
            });
        }
    }, [loading, site, form]);

    const onSubmit = async (data: DomainFormData) => {
        const result = await saveSite(data);

        if (result.success && result.id) {
            toast({ title: 'Domains Saved', description: 'Your domain settings have been updated.' });
            const newSiteData = {
                ...(site || { id: result.id, tier: 'free', url: '' }),
                ...data,
            };
            setSite(newSiteData as Site);
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
                    <CardTitle>Your Domains</CardTitle>
                    <CardDescription>The list of domains connected to your site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {domainFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                           <FormField
                                control={form.control}
                                name={`domains.${index}.value`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                    <Input {...field} placeholder="e.g., yourdomain.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDomain(index)}>
                                <Trash2 className="text-destructive h-5 w-5" />
                            </Button>
                        </div>
                    ))}
                     <Button type="button" variant="outline" onClick={() => appendDomain({ value: '' })}>
                        <Plus className="mr-2" /> Add Domain
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Redirection Rules</CardTitle>
                    <CardDescription>Global rules that apply to all domains listed above.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="domainSettings.forceHttps"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 shadow-sm">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-0.5">
                                <FormLabel className="leading-none cursor-pointer">Force HTTPS</FormLabel>
                                <FormDescription>Redirect all HTTP traffic to HTTPS.</FormDescription>
                            </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="domainSettings.redirectToNonWww"
                      render={({ field }) => (
                         <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 shadow-sm">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-0.5">
                                <FormLabel className="leading-none cursor-pointer">Redirect 'www' to non-'www'</FormLabel>
                                <FormDescription>Ensure all traffic goes to your bare domain.</FormDescription>
                            </div>
                        </FormItem>
                      )}
                    />
                </CardContent>
            </Card>


            <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Save All Settings
                </Button>
            </CardFooter>
        </form>
    </Form>
  );
}
