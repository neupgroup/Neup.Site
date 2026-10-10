
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveAsset } from '@/services/editor/asset';
import type { Asset } from '@/services/asset/type';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from "@neup/components/ui/link-button";
import { Input } from '@neup/components/ui/input';
import { Textarea } from '@neup/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@neup/components/ui/form';
import { useToast } from '@neup/core/hooks/useToast';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { useProfile } from '@/inapp/context/ProfileContext';
import { Skeleton } from '@neup/components/ui/skeleton';
import { cn } from '@neup/core/utils';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@neup/components/ui/switch';
import { Instagram, Youtube, Github, Facebook, Globe, MessageCircle, Music2, AtSign, Send, Camera, Phone, Video, Briefcase, CircleHelp, BookOpen, MapPin, Linkedin, Twitter, Mail, Home } from 'lucide-react';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import { appendProject } from '@/inapp/helpers/application-mode';

export const SocialProfileSchema = z.object({
    platformName: z.string().min(1, 'Platform name is required'),
    url: z.string().min(1, 'URL is required'),
});

export const ProfileFormSchema = z.object({
    name: z.string().min(1, 'Profile Name is required'),
    hideSitename: z.boolean().default(false),
    tagline: z.string().optional(),
    description: z.string().optional(),
    socialProfiles: z.array(SocialProfileSchema).max(32, 'You can add a maximum of 32 social profiles.'),
    contactEmail: z.array(z.object({ value: z.string().email() })).max(9, 'You can add a maximum of 9 emails.'),
    contactPhone: z.array(z.object({ value: z.string() })).max(9, 'You can add a maximum of 9 phone numbers.'),
    contactLocation: z.string().optional(),
    mailingAddress: z.string().optional(),
}).refine(data => !data.hideSitename, {
    message: "You cannot hide the asset name.",
    path: ["hideSitename"],
});


export type ProfileFormData = z.infer<typeof ProfileFormSchema>;

const socialPlatforms = [
    { name: 'Instagram', icon: Instagram, color: '#E4405F' },
    { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { name: 'Discord', icon: MessageCircle, color: '#5865F2' },
    { name: 'YouTube', icon: Youtube, color: '#FF0000' },
    { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    { name: 'TikTok', icon: Music2, color: '#000000' },
    { name: 'GitHub', icon: Github, color: '#181717' },
    { name: 'Threads', icon: AtSign, color: '#000000' },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { name: 'Snapchat', icon: Camera, color: '#FFFC00' },
    { name: 'Telegram', icon: Send, color: '#26A5E4' },
    { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    { name: 'WeChat', icon: MessageCircle, color: '#07C160' },
    { name: 'Pinterest', icon: Globe, color: '#BD081C' },
    { name: 'Tumblr', icon: Globe, color: '#35465C' },
    { name: 'BeReal', icon: Camera, color: '#000000' },
    { name: 'Viber', icon: Phone, color: '#7360F2' },
    { name: 'Dribbble', icon: Globe, color: '#EA4C89' },
    { name: 'Twitch', icon: Video, color: '#9146FF' },
    { name: 'Behance', icon: Briefcase, color: '#1769FF' },
    { name: 'Flickr', icon: ImageIcon, color: '#0063DC' },
    { name: 'Quora', icon: CircleHelp, color: '#B92B27' },
    { name: 'Reddit', icon: MessageCircle, color: '#FF4500' },
    { name: 'Goodreads', icon: BookOpen, color: '#553B08' },
    { name: 'VK', icon: Globe, color: '#0077FF' },
    { name: 'Myspace', icon: Music2, color: '#030303' },
    { name: 'Zoom', icon: Video, color: '#2D8CFF' },
    { name: 'Tripadvisor', icon: MapPin, color: '#34E0A1' },
    { name: 'Bluesky', icon: Globe, color: '#0085FF' },
    { name: 'Stack Overflow', icon: CircleHelp, color: '#F48024' },
    { name: 'Medium', icon: BookOpen, color: '#000000' },
    { name: 'Wattpad', icon: BookOpen, color: '#FF500A' },
    { name: 'Google Maps', icon: MapPin, color: '#4285F4' },
    { name: 'Website', icon: Globe, color: '#334155' },
];

const socialPlatformDomains: Record<string, string[]> = {
    instagram: ['instagram.com'], facebook: ['facebook.com', 'fb.com'], discord: ['discord.com', 'discord.gg'],
    youtube: ['youtube.com', 'youtu.be'], twitter: ['twitter.com', 'x.com'], tiktok: ['tiktok.com'], github: ['github.com'], threads: ['threads.com', 'threads.net'],
    linkedin: ['linkedin.com'], snapchat: ['snapchat.com'], telegram: ['t.me', 'telegram.me', 'telegram.org'],
    whatsapp: ['whatsapp.com', 'wa.me'], wechat: ['wechat.com', 'weixin.qq.com'], pinterest: ['pinterest.com', 'pin.it'],
    tumblr: ['tumblr.com'], bereal: ['bere.al', 'bereal.com'], viber: ['viber.com'], dribbble: ['dribbble.com'],
    twitch: ['twitch.tv'], behance: ['behance.net'], flickr: ['flickr.com'], quora: ['quora.com'], reddit: ['reddit.com'],
    goodreads: ['goodreads.com'], vk: ['vk.com'], myspace: ['myspace.com'], zoom: ['zoom.us'], tripadvisor: ['tripadvisor.com'],
    bluesky: ['bsky.app'], 'stack overflow': ['stackoverflow.com'], medium: ['medium.com'], wattpad: ['wattpad.com'],
    googlemaps: ['maps.google.com', 'google.com', 'maps.app.goo.gl', 'goo.gl'],
};

const platformsWithAtUsernames = new Set(['youtube', 'threads', 'tiktok', 'medium']);

const socialUsernameHint = (platformName: string) => {
    const hints: Record<string, string> = {
        instagram: 'username or instagram.com/username',
        facebook: 'username or facebook.com/username',
        discord: 'userid or discord.com/users/userid',
        youtube: '@username or youtube.com/@username',
        twitter: 'username or twitter.com/username',
        tiktok: '@username or tiktok.com/@username',
        github: 'username or github.com/username',
        threads: '@username or threads.com/@username',
        linkedin: 'username or linkedin.com/in/username',
        snapchat: 'username or snapchat.com/add/username',
        telegram: 'username or t.me/username',
        whatsapp: 'phone number or wa.me/number',
        wechat: 'username or weixin.qq.com/r/username',
        pinterest: 'username or pinterest.com/username',
        tumblr: 'username or username.tumblr.com',
        bereal: 'username or bere.al/username',
        viber: 'username or viber.com/username',
        dribbble: 'username or dribbble.com/username',
        twitch: 'username or twitch.tv/username',
        behance: 'username or behance.net/username',
        flickr: 'username or flickr.com/people/username',
        quora: 'username or quora.com/profile/username',
        reddit: 'username or reddit.com/users/username',
        goodreads: 'username or goodreads.com/user/show/username',
        vk: 'username or vk.com/username',
        myspace: 'username or myspace.com/username',
        zoom: 'username or zoom.us/profile/username',
        tripadvisor: 'username or tripadvisor.com/Profile/username',
        bluesky: 'username or bsky.app/profile/username',
        stackoverflow: 'userid or stackoverflow.com/users/userid',
        medium: '@username or medium.com/@username',
        website: 'https://example.com',
        googlemaps: 'maps.google.com or maps.app.goo.gl link',
        wattpad: 'username or wattpad.com/user/username',
    };
    return hints[platformName.toLowerCase().replace(/[^a-z0-9]/g, '')] || 'username or profile link';
};

const socialUsername = (platformName: string, value: string): string | null => {
    const cleaned = value.trim();
    if (!cleaned) return '';

    const platformKey = platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (platformKey === 'linkedin') {
        const linkedinPath = (path: string) => {
            const match = path.match(/^\/?(in|company)\/([a-zA-Z0-9._-]+)\/?$/i);
            if (!match) return null;
            return match[1].toLowerCase() === 'company' ? `company/${match[2]}` : `/in/${match[2]}`;
        };
        const directPath = linkedinPath(cleaned);
        if (directPath) return directPath;
        if (!cleaned.includes('/') && /^[a-zA-Z0-9._-]+$/.test(cleaned)) return `/in/${cleaned}`;
        const candidate = /^(?:https?:\/\/|www\.)/i.test(cleaned) ? (/^www\./i.test(cleaned) ? `https://${cleaned}` : cleaned) : `https://${cleaned}`;
        try {
            const parsed = new URL(candidate);
            if (!['linkedin.com', 'www.linkedin.com'].includes(parsed.hostname.toLowerCase())) return null;
            return linkedinPath(parsed.pathname);
        } catch {
            return null;
        }
    }
    if (platformKey === 'website' || platformKey === 'googlemaps') {
        const candidate = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
        try {
            const parsed = new URL(candidate);
            if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) return null;
            if (platformKey === 'googlemaps') {
                const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
                const validHost = socialPlatformDomains.googlemaps.includes(host);
                const validGoogleMapsPath = host !== 'google.com' || parsed.pathname.startsWith('/maps');
                if (!validHost || !validGoogleMapsPath) return null;
            }
            return parsed.toString().replace(/\/$/, '');
        } catch {
            return null;
        }
    }

    const lowerValue = cleaned.toLowerCase();
    const domainValue = lowerValue.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const looksLikeKnownDomain = Object.values(socialPlatformDomains).flat().some((domain) =>
        domainValue === domain || domainValue.startsWith(`${domain}/`) || domainValue.startsWith(`${domain}?`)
    );
    const looksLikeLink = /^(?:https?:\/\/|www\.)/i.test(cleaned) || cleaned.includes('/') || looksLikeKnownDomain;
    if (!looksLikeLink) return platformsWithAtUsernames.has(platformKey) ? cleaned : cleaned.replace(/^@/, '');

    const candidate = /^www\./i.test(cleaned)
        ? `https://${cleaned}`
        : /^https?:\/\//i.test(cleaned)
            ? cleaned
            : `https://${cleaned}`;

    try {
        const parsed = new URL(candidate);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
        const acceptedDomains = socialPlatformDomains[platformName.toLowerCase()] || [];
        const validHost = acceptedDomains.includes(host) || (platformName.toLowerCase() === 'tumblr' && host.endsWith('.tumblr.com'));
        if (!validHost) return null;

        const pathParts = parsed.pathname.split('/').filter(Boolean);
        if (platformName.toLowerCase() === 'discord' && host === 'discord.com' && pathParts[0] === 'users') pathParts.shift();
        const key = platformName.toLowerCase();
        if (key === 'linkedin' && ['in', 'company'].includes(pathParts[0])) pathParts.shift();
        if (key === 'snapchat' && pathParts[0] === 'add') pathParts.shift();
        if (key === 'reddit' && ['user', 'users', 'u'].includes(pathParts[0])) pathParts.shift();
        if (key === 'quora' && pathParts[0] === 'profile') pathParts.shift();
        if (key === 'telegram' && ['s', 'share'].includes(pathParts[0])) pathParts.shift();
        if (key === 'whatsapp' && ['channel', 'c'].includes(pathParts[0])) pathParts.shift();
        if (key === 'twitch' && pathParts[0] === 'popout') pathParts.shift();
        if (key === 'stackoverflow' && pathParts[0] === 'users') pathParts.shift();
        if (key === 'goodreads' && ['user', 'show'].includes(pathParts[0])) pathParts.shift();
        if (['medium', 'threads', 'tiktok', 'youtube'].includes(key)) {
            const username = pathParts[0]?.replace(/^@/, '');
            return username ? `@${username}` : null;
        }
        if (key === 'tumblr' && host.endsWith('.tumblr.com')) return host.slice(0, -'.tumblr.com'.length);
        const pathUsername = pathParts[0];
        if (!pathUsername) return parsed.hostname.split('.')[0] && key === 'tumblr' ? parsed.hostname.split('.')[0] : null;
        return platformsWithAtUsernames.has(key) ? `@${pathUsername.replace(/^@/, '')}` : pathUsername.replace(/^@/, '');
    } catch {
        return null;
    }
};

export default function IdentityEditor({ section = 'identity' }: { section?: 'identity' | 'assets' | 'connections' }) {
    const { asset, setAsset, loading } = useProfile();
    const { toast } = useToast();
    usePageTitle(section === 'connections' ? 'Socials and Connections' : section === 'assets' ? 'Branding Assets' : 'Site Identity');
    const searchParams = useSearchParams();
    const project = searchParams.get('project');
    const [savingInfoFor, setSavingInfoFor] = useState('');
    const [activeSocialIndex, setActiveSocialIndex] = useState<number | null>(null);
    const [editingSocialIndex, setEditingSocialIndex] = useState<number | null>(null);
    const [editingContact, setEditingContact] = useState<
        | { kind: 'email' | 'phone'; index: number }
        | { kind: 'location' | 'mailingAddress' }
        | null
    >(null);

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            name: '',
            hideSitename: false,
            tagline: '',
            description: '',
            socialProfiles: [],
            contactEmail: [],
            contactPhone: [],
            contactLocation: '',
            mailingAddress: '',
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
        if (loading) return;

        if (asset) {
            form.reset({
                name: asset.name,
                hideSitename: asset.hideSitename || false,
                tagline: asset.tagline || '',
                description: asset.description || '',
                socialProfiles: asset.socialProfiles?.map(p => ({ ...p, url: socialUsername(p.platformName, p.url) })) || [],
                contactEmail: asset.contactEmail || [],
                contactPhone: asset.contactPhone || [],
                contactLocation: asset.contactLocation || '',
                mailingAddress: asset.mailingAddress || '',
            });
        } else {
            toast({ variant: 'destructive', title: 'Notice', description: 'Could not load asset data. A new asset profile will be created on save.' });
            form.reset({
                name: 'My New Asset',
                hideSitename: false,
                tagline: '',
                description: 'A brief description of my new asset.',
                socialProfiles: [],
                contactEmail: [],
                contactPhone: [],
                contactLocation: '',
                mailingAddress: '',
            })
        }
    }, [loading, asset, form, toast]);

    const onSubmit = async (data: ProfileFormData) => {
        const sectionData: Partial<ProfileFormData> = section === 'identity'
            ? { name: data.name, tagline: data.tagline, description: data.description }
            : section === 'assets'
                ? { hideSitename: data.hideSitename }
            : section === 'connections'
                ? { socialProfiles: data.socialProfiles, contactPhone: data.contactPhone, contactEmail: data.contactEmail, contactLocation: data.contactLocation, mailingAddress: data.mailingAddress }
                : {};
        const dataToSave = { ...asset, ...sectionData };

        const result = await saveAsset(dataToSave);

        if (result.success && result.id) {
            toast({ title: 'Profile Saved', description: 'Your asset information has been updated.' });
            const newAssetData = {
                ...(asset || { id: result.id, tier: 'free', url: '' }),
                ...dataToSave,
            };
            setAsset(newAssetData as Asset);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const getNormalizedSocialProfiles = (socialProfiles: ProfileFormData['socialProfiles']) =>
        socialProfiles.map((profile) => ({
            ...profile,
            url: socialUsername(profile.platformName, profile.url),
        }));

    const saveSocialProfiles = async (socialProfiles: ProfileFormData['socialProfiles'], platformName?: string) => {
        const normalizedProfiles = getNormalizedSocialProfiles(socialProfiles.filter((profile) => profile.url.trim().length > 0));
        let hasInvalidUsername = false;

        normalizedProfiles.forEach((profile, index) => {
            const fieldName = `socialProfiles.${index}.url` as const;
            const key = socialProfiles[index]?.platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const usernamePattern = key === 'linkedin'
                ? /^(?:\/in\/|company\/)[a-zA-Z0-9._-]+$/
                : platformsWithAtUsernames.has(key) ? /^@?[a-zA-Z0-9._-]+$/ : /^[a-zA-Z0-9._-]+$/;
            const isValidSpecialUrl = ['website', 'googlemaps'].includes(key) && (() => {
                try {
                    const parsed = new URL(profile.url || '');
                    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) return false;
                    if (key === 'googlemaps') {
                        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
                        return socialPlatformDomains.googlemaps.includes(host) && (host !== 'google.com' || parsed.pathname.startsWith('/maps'));
                    }
                    return true;
                } catch {
                    return false;
                }
            })();
            const isValid = profile.url !== null && (['website', 'googlemaps'].includes(key) ? isValidSpecialUrl : (!profile.url || usernamePattern.test(profile.url)));
            if (!isValid) {
                form.setError(fieldName, { type: 'validate', message: 'Invalid Username. Pass a valid username.' });
                hasInvalidUsername = true;
            } else {
                form.clearErrors(fieldName);
            }
        });

        if (hasInvalidUsername) return;

        setSavingInfoFor(platformName || 'social links');
        const profilesWithUsernames = normalizedProfiles as ProfileFormData['socialProfiles'];
        const result = await saveAsset({ socialProfiles: profilesWithUsernames });
        setSavingInfoFor('');
        if (result.success) {
            setAsset({ ...(asset || { id: result.id || '', tier: 'free', url: '' }), socialProfiles: profilesWithUsernames } as Asset);
        } else {
            toast({ variant: 'destructive', title: 'Could not save social links', description: result.error });
        }
    };

    const saveContactDetails = async (overrides: Partial<Pick<ProfileFormData, 'contactEmail' | 'contactPhone'>> = {}): Promise<boolean> => {
        const values = form.getValues();
        const contactEmail = (overrides.contactEmail ?? values.contactEmail).filter((entry) => entry.value.trim().length > 0);
        const contactPhone = (overrides.contactPhone ?? values.contactPhone).filter((entry) => entry.value.trim().length > 0);
        const invalidEmailIndex = (overrides.contactEmail ?? values.contactEmail).findIndex((entry) => entry.value.trim() && !z.string().email().safeParse(entry.value.trim()).success);
        if (invalidEmailIndex >= 0) {
            form.setError(`contactEmail.${invalidEmailIndex}.value`, { type: 'validate', message: 'Enter a valid email address.' });
            return false;
        }
        const contactLocation = values.contactLocation?.trim() || '';
        const mailingAddress = values.mailingAddress?.trim() || '';
        const contactName = editingContact?.kind === 'mailingAddress'
            ? 'Mailing Address'
            : editingContact?.kind ? editingContact.kind.charAt(0).toUpperCase() + editingContact.kind.slice(1) : 'Contact details';
        setSavingInfoFor(contactName);
        const result = await saveAsset({ contactEmail, contactPhone, contactLocation, mailingAddress });
        setSavingInfoFor('');
        if (result.success) {
            setAsset({ ...(asset || { id: result.id || '', tier: 'free', url: '' }), contactEmail, contactPhone, contactLocation, mailingAddress } as Asset);
            return true;
        } else {
            toast({ variant: 'destructive', title: 'Could not save contact details', description: result.error });
            return false;
        }
    };

    const addSocialPlatform = (platformName: string) => {
        if (socialFields.length >= 32 || socialFields.some((profile) => profile.platformName.toLowerCase() === platformName.toLowerCase())) return;
        setEditingContact(null);
        appendSocial({ platformName, url: '' });
        setEditingSocialIndex(socialFields.length);
    };

    const descriptionLength = form.watch('description')?.length || 0;
    const activeEditorPlatform = editingSocialIndex !== null && socialFields[editingSocialIndex]
        ? form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName
        : null;
    const activeEditorTitle = activeEditorPlatform || (editingContact?.kind === 'mailingAddress'
        ? 'Mailing Address'
        : editingContact?.kind ? editingContact.kind.charAt(0).toUpperCase() + editingContact.kind.slice(1) : '');

    const descIndicatorColor = () => {
        if (descriptionLength >= 60 && descriptionLength <= 180) return 'bg-green-500';
        if (descriptionLength > 180 && descriptionLength <= 220) return 'bg-orange-500';
        if (descriptionLength > 220) return 'bg-red-500';
        return 'bg-muted';
    };

    if (loading) {
        return (
            <div className="w-full space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={`w-full space-y-8 ${section === 'identity' ? 'max-w-[760px]' : ''}`}>
                <header>
                    <h1 className="text-3xl font-bold font-headline">{section === 'identity' ? 'Site Identity' : section === 'connections' ? 'Socials and Connections' : 'Branding Assets'}</h1>
                    <p className="text-muted-foreground">{section === 'identity' ? 'Manage your site name, tagline, and description.' : section === 'connections' ? 'Manage your contact details and social media links.' : 'Manage your logo and icons.'}</p>
                </header>

                {section === 'identity' ? <div className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tagline" render={({ field }) => (
                            <FormItem><FormLabel>Tagline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea {...field} /></FormControl>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className={cn("w-2 h-2 rounded-full", descIndicatorColor())}></div>
                                    <span>{descriptionLength} characters</span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div> : null}

                {section === 'assets' ? <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Branding Assets</CardTitle>
                                <CardDescription>This information may be used across your site.</CardDescription>
                            </div>
                            <LinkButton variant="outlined" href={appendProject('/identity/logo', project)}>
                                    <ImageIcon className="mr-2" /> Manage Logos
                                </LinkButton>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="hideSitename"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Hide Asset Name</FormLabel>
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
                    </CardContent>
                </Card> : null}

                {section === 'connections' ? <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {emailFields.map((field, index) => {
                                const email = form.watch(`contactEmail.${index}.value`) || '';
                                const isEditing = editingContact?.kind === 'email' && editingContact.index === index;
                                if (!email.trim() && !isEditing) return null;
                                return <button key={field.id} type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'email', index }); }} style={isEditing ? { borderColor: 'hsl(var(--foreground))', borderWidth: 2 } : undefined} className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label={`Edit email: ${email || 'empty email'}`}>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#2563eb' }}><Mail className="h-4 w-4" style={{ color: '#ffffff' }} /></span>
                                    <span className={cn("truncate", !email.trim() && "text-muted-foreground")}>{email.trim() || '________'}</span>
                                </button>;
                            })}
                            {phoneFields.map((field, index) => {
                                const phone = form.watch(`contactPhone.${index}.value`) || '';
                                const isEditing = editingContact?.kind === 'phone' && editingContact.index === index;
                                if (!phone.trim() && !isEditing) return null;
                                return <button key={field.id} type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'phone', index }); }} style={isEditing ? { borderColor: 'hsl(var(--foreground))', borderWidth: 2 } : undefined} className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label={`Edit phone: ${phone || 'empty phone number'}`}>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#16a34a' }}><Phone className="h-4 w-4" style={{ color: '#ffffff' }} /></span>
                                    <span className={cn("truncate", !phone.trim() && "text-muted-foreground")}>{phone.trim() || '________'}</span>
                                </button>;
                            })}
                            {(form.watch('contactLocation')?.trim() || editingContact?.kind === 'location') ? <button type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'location' }); }} style={editingContact?.kind === 'location' ? { borderColor: 'hsl(var(--foreground))', borderWidth: 2 } : undefined} className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label={`Edit location: ${form.watch('contactLocation') || 'empty location'}`}>
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#dc2626' }}><MapPin className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className={cn("truncate", !form.watch('contactLocation')?.trim() && "text-muted-foreground")}>{form.watch('contactLocation')?.trim() || '________'}</span>
                            </button> : null}
                            {(form.watch('mailingAddress')?.trim() || editingContact?.kind === 'mailingAddress') ? <button type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'mailingAddress' }); }} style={editingContact?.kind === 'mailingAddress' ? { borderColor: 'hsl(var(--foreground))', borderWidth: 2 } : undefined} className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label={`Edit mailing address: ${form.watch('mailingAddress') || 'empty mailing address'}`}>
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#7c3aed' }}><Home className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className={cn("truncate", !form.watch('mailingAddress')?.trim() && "text-muted-foreground")}>{form.watch('mailingAddress')?.trim() || '________'}</span>
                            </button> : null}

                            {socialFields.map((field, index) => {
                                const platformName = form.watch(`socialProfiles.${index}.platformName`) || field.platformName;
                                const username = form.watch(`socialProfiles.${index}.url`) || '';
                                const platform = socialPlatforms.find((item) => item.name.toLowerCase() === platformName.toLowerCase());
                                const PlatformIcon = platform?.icon || Globe;
                                return (
                                    <div key={field.id} className="flex min-w-0 items-center gap-1">
                                        <button type="button" onClick={() => { setEditingContact(null); setEditingSocialIndex(index); }} style={editingSocialIndex === index ? { borderColor: 'hsl(var(--foreground))', borderWidth: 2 } : undefined} className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label={`Edit ${platformName}: ${username || 'empty username'}`}>
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: platform?.color || '#64748b' }}>
                                                <PlatformIcon className={platformName === 'Snapchat' || platformName === 'Tripadvisor' ? 'h-4 w-4 text-black' : 'h-4 w-4 text-white'} />
                                            </span>
                                            <span className={cn("truncate", !username && "text-muted-foreground")}>{username ? (platformName.toLowerCase() === 'linkedin' ? username.slice(username.lastIndexOf('/') + 1) : platformsWithAtUsernames.has(platformName.toLowerCase().replace(/[^a-z0-9]/g, '')) && !username.startsWith('@') ? `@${username}` : username) : '________'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {(editingSocialIndex !== null && socialFields[editingSocialIndex]) || editingContact ? <div className="w-full max-w-lg space-y-2 pt-6 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-sm font-medium">Editing {activeEditorTitle}</p>
                            <div className="flex items-start gap-2">
                            {editingSocialIndex !== null && socialFields[editingSocialIndex] ? <>
                            <FormField control={form.control} name={`socialProfiles.${editingSocialIndex}.url`} render={({ field: urlField }) => (
                                <FormItem className="min-w-0 flex-1">
                                            <FormControl><Input {...urlField} value={(() => { const name = form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName; const value = urlField.value || ''; return name.toLowerCase() === 'linkedin' && value.startsWith('/in/') ? value.slice('/in/'.length) : value; })()} autoComplete="off" autoFocus preIcon={<span className="flex h-6 items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: socialPlatforms.find((item) => item.name.toLowerCase() === (form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName).toLowerCase())?.color || '#64748b' }}>{(() => { const name = form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName; const Icon = socialPlatforms.find((item) => item.name.toLowerCase() === name.toLowerCase())?.icon || Globe; return <Icon className={name === 'Snapchat' || name === 'Tripadvisor' ? 'h-4 w-4 text-black' : 'h-4 w-4 text-white'} />; })()}</span><span className="h-5 border-l border-border" aria-hidden="true" /></span>} aria-label={`${form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName} URL or username`} placeholder={socialUsernameHint(form.watch(`socialProfiles.${editingSocialIndex}.platformName`) || socialFields[editingSocialIndex].platformName)} className="pl-12" onBlur={() => { const name = form.getValues(`socialProfiles.${editingSocialIndex}.platformName`); setActiveSocialIndex(null); setEditingSocialIndex(null); urlField.onBlur(); if (urlField.value.trim()) void saveSocialProfiles(form.getValues('socialProfiles'), name); }} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button htmlType="button" variant="plain" convey="danger" size="icon" onMouseDown={(event) => event.preventDefault()} onClick={() => {
                                const nextProfiles = form.getValues('socialProfiles').filter((_, index) => index !== editingSocialIndex);
                                removeSocial(editingSocialIndex);
                                setEditingSocialIndex(null);
                                setActiveSocialIndex(null);
                                void saveSocialProfiles(nextProfiles, socialFields[editingSocialIndex].platformName);
                            }} aria-label="Remove social platform"><Trash2 /></Button>
                            </> : null}

                        {editingContact ? <div className="flex w-full max-w-lg items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="min-w-0 flex-1">
                                {editingContact.kind === 'email' ? <FormField control={form.control} name={`contactEmail.${editingContact.index}.value`} render={({ field }) => (
                                    <FormItem><FormControl><Input type="email" {...field} autoFocus placeholder="you@example.com" preIcon={<span className="flex h-6 items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#2563eb' }}><Mail className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className="h-5 border-l border-border" aria-hidden="true" /></span>} className="pl-12" onBlur={() => { field.onBlur(); setEditingContact(null); if (field.value.trim()) void saveContactDetails(); }} /></FormControl><FormMessage /></FormItem>
                                )} /> : null}
                                {editingContact.kind === 'phone' ? <FormField control={form.control} name={`contactPhone.${editingContact.index}.value`} render={({ field }) => (
                                    <FormItem><FormControl><Input type="tel" {...field} autoFocus placeholder="+1 (555) 123-4567" preIcon={<span className="flex h-6 items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#16a34a' }}><Phone className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className="h-5 border-l border-border" aria-hidden="true" /></span>} className="pl-12" onBlur={() => { field.onBlur(); setEditingContact(null); if (field.value.trim()) void saveContactDetails(); }} /></FormControl><FormMessage /></FormItem>
                                )} /> : null}
                                {editingContact.kind === 'location' ? <FormField control={form.control} name="contactLocation" render={({ field }) => (
                                    <FormItem><FormControl><Input {...field} autoFocus placeholder="City, Country" preIcon={<span className="flex h-6 items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#dc2626' }}><MapPin className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className="h-5 border-l border-border" aria-hidden="true" /></span>} className="pl-12" onBlur={() => { field.onBlur(); setEditingContact(null); if (field.value?.trim()) void saveContactDetails(); }} /></FormControl><FormMessage /></FormItem>
                                )} /> : null}
                                {editingContact.kind === 'mailingAddress' ? <FormField control={form.control} name="mailingAddress" render={({ field }) => (
                                    <FormItem><FormControl><Input {...field} autoFocus placeholder="Street address, city, postal code" preIcon={<span className="flex h-6 items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#7c3aed' }}><Home className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span className="h-5 border-l border-border" aria-hidden="true" /></span>} className="pl-12" onBlur={() => { field.onBlur(); setEditingContact(null); if (field.value?.trim()) void saveContactDetails(); }} /></FormControl><FormMessage /></FormItem>
                                )} /> : null}
                            </div>
                            <Button htmlType="button" variant="plain" convey="danger" size="icon" onMouseDown={(event) => event.preventDefault()} onClick={() => {
                                if (editingContact.kind === 'email') {
                                    const nextEmails = form.getValues('contactEmail').filter((_, index) => index !== editingContact.index);
                                    removeEmail(editingContact.index);
                                    void saveContactDetails({ contactEmail: nextEmails });
                                } else if (editingContact.kind === 'phone') {
                                    const nextPhones = form.getValues('contactPhone').filter((_, index) => index !== editingContact.index);
                                    removePhone(editingContact.index);
                                    void saveContactDetails({ contactPhone: nextPhones });
                                } else if (editingContact.kind === 'location') {
                                    form.setValue('contactLocation', '', { shouldDirty: true });
                                    void saveContactDetails();
                                } else {
                                    form.setValue('mailingAddress', '', { shouldDirty: true });
                                    void saveContactDetails();
                                }
                                setEditingContact(null);
                            }} aria-label="Remove contact detail"><Trash2 /></Button>
                        </div> : null}
                            </div>
                        </div> : null}
                        {savingInfoFor ? <p className="text-sm text-muted-foreground" role="status">Saving info for {savingInfoFor}…</p> : null}
                    </div>

                    <section className="space-y-4 pt-5" aria-label="Add another platform">
                        <div>
                            <h3 className="text-lg font-semibold">Add another platform</h3>
                            <p className="text-sm text-muted-foreground">Choose a platform or contact detail to add.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {emailFields.length === 0 ? <button type="button" onClick={() => { if (emailFields.length > 0) return; appendEmail({ value: '' }); setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'email', index: 0 }); }} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label="Add email"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#2563eb' }}><Mail className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span>Email</span></button> : null}
                            {phoneFields.length === 0 ? <button type="button" onClick={() => { if (phoneFields.length > 0) return; appendPhone({ value: '' }); setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'phone', index: 0 }); }} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label="Add phone"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#16a34a' }}><Phone className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span>Phone</span></button> : null}
                            {!form.watch('contactLocation')?.trim() && editingContact?.kind !== 'location' ? <button type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'location' }); }} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label="Add location"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#dc2626' }}><MapPin className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span>Location</span></button> : null}
                            {!form.watch('mailingAddress')?.trim() && editingContact?.kind !== 'mailingAddress' ? <button type="button" onClick={() => { setEditingSocialIndex(null); setActiveSocialIndex(null); setEditingContact({ kind: 'mailingAddress' }); }} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted" aria-label="Add mailing address"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#7c3aed' }}><Home className="h-4 w-4" style={{ color: '#ffffff' }} /></span><span>Mailing Address</span></button> : null}
                            {socialFields.length < 32 ? socialPlatforms.filter(({ name }) => !socialFields.some((profile) => profile.platformName.toLowerCase() === name.toLowerCase())).map(({ name, icon: PlatformIcon, color }) => (
                                <button key={name} type="button" onClick={() => { setEditingContact(null); addSocialPlatform(name); }} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}><PlatformIcon className={name === 'Snapchat' || name === 'Tripadvisor' ? "h-4 w-4 text-black" : "h-4 w-4 text-white"} /></span>
                                    <span>{name}</span>
                                </button>
                            )) : null}
                        </div>
                    </section>
                </div> : null}
                {section !== 'connections' ? <div className="flex justify-start">
                    <Button variant="solid" htmlType="submit" disabled={form.formState.isSubmitting}>Save Changes</Button>
                </div> : null}
            </form>
        </Form>
    );
}
