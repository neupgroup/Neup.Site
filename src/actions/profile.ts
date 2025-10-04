
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { logErrorToFirestore } from './logging';
import type { Profile } from '@/lib/profile-schema';

const normalizeUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
};

/**
 * Fetches the profile for the current site.
 */
export async function getProfile(): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const profileRef = doc(db, 'profiles', siteId);
    const docSnap = await getDoc(profileRef);

    if (!docSnap.exists()) {
      return { success: true, profile: undefined };
    }

    return { success: true, profile: { id: docSnap.id, ...docSnap.data() } as Profile };
  } catch (error: any) {
    console.error('Failed to get profile:', error);
    await logErrorToFirestore({
      message: `Failed to get profile for site ${siteId}: ${error.message}`,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to fetch profile.' };
  }
}

/**
 * Saves the profile for the current site.
 */
export async function saveProfile(profileData: Omit<Profile, 'id'>): Promise<{ success: boolean; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const profileRef = doc(db, 'profiles', siteId);
    
    const dataToSave = {
        ...profileData,
        logoUrl: normalizeUrl(profileData.logoUrl || ''),
        socialProfiles: profileData.socialProfiles.map(p => ({
            ...p,
            url: normalizeUrl(p.url)
        })),
        updatedAt: serverTimestamp()
    };

    await setDoc(profileRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save profile:', error);
    await logErrorToFirestore({
      message: `Failed to save profile for site ${siteId}: ${error.message}`,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to save profile.' };
  }
}
