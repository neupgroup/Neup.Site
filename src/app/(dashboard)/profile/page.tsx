
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileFormSchema, type Profile } from '@/lib/profile-schema';
import { getProfile, saveProfile } from '@/actions/profile';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Twitter, Github, Linkedin, Mail, Phone, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { remove } from 'firebase/database';


const removeUrlPrefix = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
}

export default function ProfilePage() {
    const { setProfileName } = useProfile();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const form = useForm<Profile>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            name: '',
            logoUrl: '',
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
        const fetchProfileData = async () => {
            setLoading(true);
            const { success, profile } = await getProfile();
            if (success && profile) {
                form.reset({
                    ...profile,
                    logoUrl: removeUrlPrefix(profile.logoUrl || ''),
                    socialProfiles: profile.socialProfiles.map(p => ({...p, url: removeUrlPrefix(p.url)}))
                });
            }
            setLoading(false);
        };
        fetchProfileData();
    }, [form]);

    const onSubmit = async (data: Profile) => {
        const result = await saveProfile(data);
        if (result.success) {
            toast({ title: 'Profile Saved', description: 'Your profile information has been updated.' });
            setProfileName(data.name);
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
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>This information may be used across your site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Profile Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="logoUrl" render={({ field }) => (
                        <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} placeholder="example.com/logo.png" /></FormControl><FormMessage /></FormItem>
                    )} />
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
                                <Mail className="text-muted-foreground" />
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
                                <Phone className="text-muted-foreground" />
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
