
'use client';
import { z } from 'zod';

export const SocialProfileSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  url: z.string().min(1, 'URL is required'),
});

export const ProfileFormSchema = z.object({
  name: z.string().min(1, 'Profile Name is required'),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  socialProfiles: z.array(SocialProfileSchema).max(9, 'You can add a maximum of 9 social profiles.'),
  contactEmail: z.array(z.object({ value: z.string().email() })).max(9, 'You can add a maximum of 9 emails.'),
  contactPhone: z.array(z.object({ value: z.string() })).max(9, 'You can add a maximum of 9 phone numbers.'),
});

export type Profile = z.infer<typeof ProfileFormSchema> & { id: string };
