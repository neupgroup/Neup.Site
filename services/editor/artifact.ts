
'use server';

import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp
} from '@/lib/firestore';
import { cookies } from 'next/headers';
import { Artifact, ArtifactTheme, ArtifactIcons } from '@/schemas/artifact';
import { getDataStore } from '@/lib/data-store';
import { generateThemeFromColor } from '@/lib/color-utils';
import { markAssetsAsPending, markThemeAsPending } from '@/services/structure';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { syncArtifactProfileSubjects } from '@/services/profiles';



/**
 * Fetches a single artifact configuration document.
 * The ID of the document is expected to be the artifactId from the cookie.
 */
export async function getArtifact(): Promise<{ success: boolean, artifact?: Artifact, error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: true, artifact: undefined };

  try {
    const { firestore } = getDataStore();
    const artifactRef = doc(firestore, 'artifacts', artifactId);
    const themeRef = doc(firestore, 'themes', artifactId);

    const [docSnap, themeSnap, profileEntries] = await Promise.all([
      getDoc(artifactRef),
      getDoc(themeRef),
      db.profile.findMany({
        where: { artifactId },
        select: { subject: true, value: true },
      }),
    ]);

    if (!docSnap.exists()) {
      return { success: true, artifact: undefined };
    }

    const data = docSnap.data();
    const themeData = themeSnap.exists() ? themeSnap.data() : {};
    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;

    const subjectToValues = new Map<string, string[]>();
    const socialProfilesFromDb: { platformName: string; url: string }[] = [];

    profileEntries.forEach((entry) => {
      const values = subjectToValues.get(entry.subject) ?? [];
      values.push(entry.value);
      subjectToValues.set(entry.subject, values);

      if (entry.subject.startsWith('socialProfile.')) {
        const platformName = entry.subject.slice('socialProfile.'.length);
        if (platformName) {
          socialProfilesFromDb.push({ platformName, url: entry.value });
        }
      }
    });

    const contactEmailFromDb = subjectToValues.get('contact.email')?.map((value) => ({ value })) ?? [];
    const contactPhoneFromDb = subjectToValues.get('contact.phone')?.map((value) => ({ value })) ?? [];
    const logoUrlFromDb = subjectToValues.get('brand.logo')?.[0];
    const descriptionFromDb = subjectToValues.get('brand.description')?.[0];

    const artifact: Artifact = {
      id: docSnap.id,
      name: data.name || '',
      url: data.url,
      domains: data.domains,
      tier: data.tier,
      logoUrl: logoUrlFromDb ?? data.logoUrl,
      icons: data.icons || {},
      hideSitename: themeData.hideSitename || false,
      hideLogo: themeData.hideLogo || false,
      description: descriptionFromDb ?? data.description,
      socialProfiles: socialProfilesFromDb.length ? socialProfilesFromDb : (data.socialProfiles || []),
      contactEmail: contactEmailFromDb.length ? contactEmailFromDb : (data.contactEmail || []),
      contactPhone: contactPhoneFromDb.length ? contactPhoneFromDb : (data.contactPhone || []),
      modules: data.modules || {},
      theme: themeData.theme || {},
      createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
    }

    return { success: true, artifact };

  } catch (error: any) {
    return { success: false, error: 'Failed to fetch artifact configuration. An error has been logged.' };
  }
}


/**
 * Saves or creates an artifact configuration document.
 */
export async function saveArtifact(data: Partial<Omit<Artifact, 'id'>>) {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const artifactRef = doc(firestore, 'artifacts', artifactId);
    const themeRef = doc(firestore, 'themes', artifactId);

    const [docSnap, themeSnap] = await Promise.all([getDoc(artifactRef), getDoc(themeRef)]);
    const existingData = docSnap.exists() ? docSnap.data() as Artifact : {};
    const existingThemeData = themeSnap.exists() ? (themeSnap.data() as Partial<Pick<Artifact, 'hideSitename' | 'hideLogo' | 'theme'>>) : {};

    const {
      hideSitename: nextHideSitename,
      hideLogo: nextHideLogo,
      theme: nextTheme,
      ...artifactDataPatch
    } = data;

    let dataToSave: any = { ...artifactDataPatch, updatedAt: serverTimestamp() };
    let themeToSave: any = { updatedAt: serverTimestamp() };

    // These fields are now stored in the `profile` table (subject/value), not on `artifact`.
    delete dataToSave.logoUrl;
    delete dataToSave.description;
    delete dataToSave.socialProfiles;
    delete dataToSave.contactEmail;
    delete dataToSave.contactPhone;

    if (!docSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
    }
    if (!themeSnap.exists()) {
      themeToSave.createdAt = serverTimestamp();
    }

    if (data.domains) {
      dataToSave.domains = {
        ...(existingData.domains || {}),
        production: {
          ...existingData.domains?.production,
          ...data.domains.production,
        },
        development: {
          ...existingData.domains?.development,
          ...data.domains.development,
        },
      };
    }

    if (typeof data.logoUrl === 'string' && data.logoUrl.trim()) {
      await markAssetsAsPending(artifactId);
    }

    if (data.icons) {
      dataToSave.icons = { ...(existingData.icons || {}), ...data.icons };
      await markAssetsAsPending(artifactId);
    }

    const hideSitenameChanged =
      typeof nextHideSitename === 'boolean' && nextHideSitename !== existingThemeData.hideSitename;
    const hideLogoChanged =
      typeof nextHideLogo === 'boolean' && nextHideLogo !== existingThemeData.hideLogo;

    if (data.name !== existingData.name || hideSitenameChanged || hideLogoChanged) {
      await markAssetsAsPending(artifactId);
    }

    if (data.socialProfiles) {
      await markAssetsAsPending(artifactId);
    }

    if (typeof nextHideSitename === 'boolean') {
      themeToSave.hideSitename = nextHideSitename;
    }
    if (typeof nextHideLogo === 'boolean') {
      themeToSave.hideLogo = nextHideLogo;
    }

    if (nextTheme) {
      themeToSave.theme = { ...nextTheme };
      if (nextTheme.colors && nextTheme.colors.length > 0) {
        themeToSave.theme.generated = generateThemeFromColor(nextTheme.colors);
      }
      await markThemeAsPending(artifactId);
    }

    await setDoc(artifactRef, dataToSave, { merge: true });
    // Save theme separately from the Artifact table.
    await setDoc(themeRef, themeToSave, { merge: true });

    const profileSync = await syncArtifactProfileSubjects({
      artifactId,
      name: typeof data.name === 'string' ? data.name : undefined,
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : undefined,
      description: typeof data.description === 'string' ? data.description : undefined,
      hideLogo: typeof nextHideLogo === 'boolean' ? nextHideLogo : undefined,
      hideSitename: typeof nextHideSitename === 'boolean' ? nextHideSitename : undefined,
      socialProfiles: data.socialProfiles,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
    });
    if (!profileSync.success) {
      return { success: false, error: profileSync.error || 'Failed to sync profile subjects.' };
    }

    revalidatePath('/', 'layout');
    return { success: true, id: artifactId };
  } catch (error: any) {
    return { success: false, error: `Failed to save artifact config for ${artifactId}. An error has been logged.` };
  }
}
