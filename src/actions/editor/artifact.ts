
'use server';

import { getFirestore } from '@/lib/firestore';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp
} from '@/lib/firestore';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/lib/url-utils';
import { Artifact, ArtifactTheme, ArtifactIcons } from '@/schemas/artifact';
import { getDataStore } from '@/lib/data-store';
import { generateThemeFromColor } from '@/lib/color-utils';
import { markAssetsAsPending, markThemeAsPending } from '../structure';

export type { Artifact, ArtifactTheme, ArtifactIcons };

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
    const docSnap = await getDoc(artifactRef);

    if (!docSnap.exists()) {
      return { success: true, artifact: undefined };
    }

    const data = docSnap.data();
    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;

    const artifact: Artifact = {
      id: docSnap.id,
      name: data.name || '',
      url: data.url,
      domains: data.domains,
      tier: data.tier,
      logoUrl: data.logoUrl,
      icons: data.icons || {},
      hideSitename: data.hideSitename || false,
      hideLogo: data.hideLogo || false,
      description: data.description,
      socialProfiles: data.socialProfiles || [],
      contactEmail: data.contactEmail || [],
      contactPhone: data.contactPhone || [],
      modules: data.modules || {},
      theme: data.theme || {},
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

    const docSnap = await getDoc(artifactRef);
    const existingData = docSnap.exists() ? docSnap.data() as Artifact : {};

    let dataToSave: any = { ...data, updatedAt: serverTimestamp() };

    if (!docSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
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

    if (data.logoUrl && data.logoUrl !== existingData.logoUrl) {
      dataToSave.logoUrl = normalizeUrl(data.logoUrl);
      await markAssetsAsPending(artifactId);
    }

    if (data.icons) {
      dataToSave.icons = { ...(existingData.icons || {}), ...data.icons };
      await markAssetsAsPending(artifactId);
    }

    if (data.name !== existingData.name || data.hideSitename !== existingData.hideSitename) {
      await markAssetsAsPending(artifactId);
    }

    if (data.socialProfiles) {
      dataToSave.socialProfiles = data.socialProfiles.map(p => ({
        ...p,
        url: normalizeUrl(p.url)
      }));
      await markAssetsAsPending(artifactId);
    }

    if (data.theme) {
      dataToSave.theme = { ...data.theme };
      if (data.theme.colors && data.theme.colors.length > 0) {
        dataToSave.theme.generated = generateThemeFromColor(data.theme.colors);
      }
      await markThemeAsPending(artifactId);
    }


    await setDoc(artifactRef, dataToSave, { merge: true });
    return { success: true, id: artifactId };
  } catch (error: any) {
    return { success: false, error: `Failed to save artifact config for ${artifactId}. An error has been logged.` };
  }
}
