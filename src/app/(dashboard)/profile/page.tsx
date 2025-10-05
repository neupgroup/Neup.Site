
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSite, saveSite, type Site } from '@/actions/editor/site';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

export const SocialProfileSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  url: z.string().min(1, 'URL is required'),
});

export const ProfileFormSchema = z.object({
  name: z.string().min(1, 'Profile Name is required'),
  hideSitename: z.boolean().default(false),
  logoUrl: z.string().optional(),
  hideLogo: z.boolean().default(false),
  description: z.string().optional(),
  socialProfiles: z.array(SocialProfileSchema).max(9, 'You can add a maximum of 9 social profiles.'),
  contactEmail: z.array(z.object({ value: z.string().email() })).max(9, 'You can add a maximum of 9 emails.'),
  contactPhone: z.array(z.object({ value: z.string() })).max(9, 'You can add a maximum of 9 phone numbers.'),
});

export type ProfileFormData = z.infer<typeof ProfileFormSchema>;

export default function ProfilePage() {
    const { setProfileName, setLogoUrl, setHideSitename, setHideLogo } = useProfile();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            name: '',
            hideSitename: false,
            logoUrl: '',
            hideLogo: false,
            description: '',
            socialProfiles: [],
            contactEmail: [],
            contactPhone: [],
        },
    });

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control: form.control,
        name: 'socialProfiles',
    });
     const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
        control: form.control,
        name: 'contactEmail',
    });
     const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control: form.control,
        name: 'contactPhone',
    });

    useEffect(() => {
        const removeUrlPrefix = (url: string | undefined): string => {
            if (!url) return '';
            return url.replace(/^(https?:\/\/)/, '');
        }
        
        const fetchProfileData = async () => {
            setLoading(true);
            const { success, site, error } = await getSite();

            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: error });
            }

            if (success && site) {
                form.reset({
                    name: site.name,
                    hideSitename: site.hideSitename || false,
                    logoUrl: removeUrlPrefix(site.logoUrl),
                    hideLogo: site.hideLogo || false,
                    description: site.description || '',
                    socialProfiles: site.socialProfiles?.map(p => ({...p, url: removeUrlPrefix(p.url)})) || [],
                    contactEmail: site.contactEmail || [],
                    contactPhone: site.contactPhone || [],
                });
            } else {
                 toast({ variant: 'destructive', title: 'Notice', description: 'Could not load site data. A new site profile will be created on save.' });
                 // If the site doesn't exist, we can pre-fill some fields or let the user start fresh
                 form.reset({
                    name: 'My New Site',
                    hideSitename: false,
                    hideLogo: false,
                    description: 'A brief description of my new site.',
                    socialProfiles: [],
                    contactEmail: [],
                    contactPhone: [],
                 })
            }
            setLoading(false);
        };
        fetchProfileData();
    }, [form, toast]);

    const onSubmit = async (data: ProfileFormData) => {
        const result = await saveSite({
            name: data.name,
            hideSitename: data.hideSitename,
            logoUrl: data.logoUrl,
            hideLogo: data.hideLogo,
            description: data.description,
            socialProfiles: data.socialProfiles,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone
        });

        if (result.success) {
            toast({ title: 'Profile Saved', description: 'Your site information has been updated.' });
            setProfileName(data.name);
            setLogoUrl(data.logoUrl ? (data.logoUrl.startsWith('http') ? data.logoUrl : `https://${data.logoUrl}`) : null);
            setHideSitename(data.hideSitename);
            setHideLogo(data.hideLogo);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const descriptionLength = form.watch('description')?.length || 0;
    const descIndicatorColor = () => {
        if (descriptionLength >= 60 && descriptionLength <= 180) return 'bg-green-500';
        if (descriptionLength > 180 && descriptionLength <= 220) return 'bg-orange-500';
        if (descriptionLength > 220) return 'bg-red-500';
        return 'bg-muted';
    };

    if (loading) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        );
    }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold font-headline">Profile</h1>
                <p className="text-muted-foreground">Manage your site's public information.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Site Information</CardTitle>
                    <CardDescription>This information may be used across your site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField
                        control={form.control}
                        name="hideSitename"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Hide Site Name</FormLabel>
                                    <FormDescription>
                                        Enable this if your logo already contains the site name.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                    <FormField control={form.control} name="logoUrl" render={({ field }) => (
                        <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} placeholder="example.com/logo.png" /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField
                        control={form.control}
                        name="hideLogo"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Hide Logo</FormLabel>
                                    <FormDescription>
                                        Enable this to hide the logo from the site header.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={cn("w-2 h-2 rounded-full", descIndicatorColor())}></div>
                                <span>{descriptionLength} characters</span>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Social Profiles</CardTitle>
                    <CardDescription>Links to your social media accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {socialFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                             <FormField control={form.control} name={`socialProfiles.${index}.platformName`} render={({ field }) => (
                                <FormItem className="flex-1"><FormLabel>Platform</FormLabel><FormControl><Input {...field} placeholder="e.g., Twitter" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`socialProfiles.${index}.url`} render={({ field }) => (
                                <FormItem className="flex-1"><FormLabel>URL</FormLabel><FormControl><Input {...field} placeholder="twitter.com/username" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeSocial(index)}><Trash2 /></Button>
                        </div>
                    ))}
                    {socialFields.length < 9 && <Button type="button" variant="outline" onClick={() => appendSocial({ platformName: '', url: '' })}><Plus className="mr-2" /> Add Social Profile</Button>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How people can get in touch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Contact Emails</Label>
                        {emailFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField control={form.control} name={`contactEmail.${index}.value`} render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input type="email" {...field} placeholder="you@example.com" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeEmail(index)}><Trash2/></Button>
                            </div>
                        ))}
                         {emailFields.length < 9 && <Button type="button" variant="outline" size="sm" onClick={() => appendEmail({ value: '' })}><Plus className="mr-2" /> Add Email</Button>}
                    </div>
                     <div className="space-y-2">
                        <Label>Contact Phone Numbers</Label>
                        {phoneFields.map((field, index) => (
                           <div key={field.id} className="flex items-center gap-2">
                                 <FormField control={form.control} name={`contactPhone.${index}.value`} render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input type="tel" {...field} placeholder="+1 (555) 123-4567" /></FormControl><FormMessage /></FormItem>
                                )} />
                               <Button type="button" variant="destructive" size="icon" onClick={() => removePhone(index)}><Trash2/></Button>
                           </div>
                        ))}
                         {phoneFields.length < 9 && <Button type="button" variant="outline" size="sm" onClick={() => appendPhone({ value: '' })}><Plus className="mr-2" /> Add Phone</Button>}
                    </div>
                </CardContent>
            </Card>
            <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Save All Changes
                </Button>
            </CardFooter>
        </form>
    </Form>
  );
}
