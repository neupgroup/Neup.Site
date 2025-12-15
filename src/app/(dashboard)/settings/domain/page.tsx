
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSite, type Site } from '@/actions/editor/site';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

const domainSchema = z.object({
    value: z.string().min(1, 'Domain is required.').refine(val => {
        const pattern = /^[a-zA-Z0-9.-]+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        return pattern.test(val);
    }, 'Invalid domain or path format.'),
    forceHttps: z.boolean().default(true),
});

export const DomainFormSchema = z.object({
    domains: z.array(domainSchema).optional(),
});

export type DomainFormData = z.infer<typeof DomainFormSchema>;

export default function DomainPage() {
    const { site, setSite, loading } = useProfile();
    const { toast } = useToast();
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState('');

    const form = useForm<DomainFormData>({
        resolver: zodResolver(DomainFormSchema),
        defaultValues: {
            domains: [],
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
            });
        }
    }, [loading, site, form]);

    const handleAddDomain = () => {
        if (!newDomain.trim()) {
            setDomainError('Domain is required');
            return;
        }

        const pattern = /^[a-zA-Z0-9.-]+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        if (!pattern.test(newDomain)) {
            setDomainError('Invalid domain or path format');
            return;
        }

        appendDomain({ value: newDomain, forceHttps: true });
        setNewDomain('');
        setDomainError('');
    };

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
                        <div className="space-y-2">
                            <Label htmlFor="new-domain">Add New Domain</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="new-domain"
                                        placeholder="e.g., yourdomain.com"
                                        value={newDomain}
                                        onChange={(e) => {
                                            setNewDomain(e.target.value);
                                            setDomainError('');
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddDomain();
                                            }
                                        }}
                                    />
                                    {domainError && <p className="text-sm text-destructive mt-1">{domainError}</p>}
                                </div>
                                <Button type="button" onClick={handleAddDomain}>
                                    <Plus className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </div>
                        </div>

                        {domainFields.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No domains added yet. Enter a domain name above to get started.</p>
                            </div>
                        ) : (
                            domainFields.map((field, index) => {
                                const domainValue = form.watch(`domains.${index}.value`);
                                return (
                                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg">{domainValue || 'New Domain'}</h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeDomain(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <FormField
                                                control={form.control}
                                                name={`domains.${index}.forceHttps`}
                                                render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                        />
                                                        <span className="text-sm">Force HTTPS</span>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`domains.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem className="hidden">
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                );
                            })
                        )}
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
