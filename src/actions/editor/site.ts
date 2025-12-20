
'use server';

import { getFirestore } from 'firebase/firestore';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/lib/url-utils';
import { Site, SiteTheme, SiteIcons } from '@/schemas/site';
import { initializeFirebase } from '@/lib/firebase';
import { generateThemeFromColor } from '@/lib/color-utils';
import { markAssetsAsPending, markThemeAsPending } from '../structure';

export type { Site, SiteTheme, SiteIcons };

/**
 * Fetches a single site configuration document.
 * The ID of the document is expected to be the siteId from the cookie.
 */
export async function getSite(): Promise<{ success: boolean, site?: Site, error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: true, site: undefined };

  try {
    const { firestore } = initializeFirebase();
    const siteRef = doc(firestore, 'sites', siteId);
    const docSnap = await getDoc(siteRef);

    if (!docSnap.exists()) {
      return { success: true, site: undefined };
    }

    const data = docSnap.data();
    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;

    const site: Site = {
      id: docSnap.id,
      name: data.name || '',
      url: data.url,
      domainSettings: data.domainSettings,
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

    return { success: true, site };

  } catch (error: any) {
    return { success: false, error: 'Failed to fetch site configuration. An error has been logged.' };
  }
}


/**
 * Saves or creates a site configuration document.
 */
export async function saveSite(data: Partial<Omit<Site, 'id'>>) {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const siteRef = doc(firestore, 'sites', siteId);

    const docSnap = await getDoc(siteRef);
    const existingData = docSnap.exists() ? docSnap.data() as Site : {};

    let dataToSave: any = { ...data, updatedAt: serverTimestamp() };

    if (!docSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
    }
    
    if (data.domainSettings) {
        dataToSave.domainSettings = {
            ...(existingData.domainSettings || {}),
            production: {
                ...existingData.domainSettings?.production,
                ...data.domainSettings.production,
            },
            staging: {
                ...existingData.domainSettings?.staging,
                ...data.domainSettings.staging,
            },
        };
    }

    if (data.logoUrl && data.logoUrl !== existingData.logoUrl) {
      dataToSave.logoUrl = normalizeUrl(data.logoUrl);
      await markAssetsAsPending(siteId);
    }
    
    if (data.icons) {
        dataToSave.icons = { ...(existingData.icons || {}), ...data.icons };
        await markAssetsAsPending(siteId);
    }
    
    if (data.name !== existingData.name || data.hideSitename !== existingData.hideSitename) {
      await markAssetsAsPending(siteId);
    }

    if (data.socialProfiles) {
      dataToSave.socialProfiles = data.socialProfiles.map(p => ({
        ...p,
        url: normalizeUrl(p.url)
      }));
       await markAssetsAsPending(siteId);
    }

    if (data.theme) {
      dataToSave.theme = { ...data.theme };
      if (data.theme.colors && data.theme.colors.length > 0) {
          dataToSave.theme.generated = generateThemeFromColor(data.theme.colors);
      }
      await markThemeAsPending(siteId);
    }


    await setDoc(siteRef, dataToSave, { merge: true });
    return { success: true, id: siteId };
  } catch (error: any) {
    return { success: false, error: `Failed to save site config for ${siteId}. An error has been logged.` };
  }
}
