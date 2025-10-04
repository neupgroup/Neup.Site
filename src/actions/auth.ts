
'use server'

import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
 
export async function setSiteIdCookie(siteId: string) {
  if (!siteId) {
    throw new Error('Site ID cannot be empty.');
  }

  const adminDb = getAdminDb();

  // Reference to the document in the 'sites' collection
  const siteRef = adminDb.collection('sites').doc(siteId);

  try {
    const docSnap = await siteRef.get();

    // If the document does not exist, create it.
    if (!docSnap.exists) {
      await siteRef.set({
        id: siteId,
        name: siteId, // Default name to the siteId
        status: 'active', // Default status
        type: 'corporate portfolio', // Default type
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    
    // Set the cookie after ensuring the site document exists
    cookies().set('siteId', siteId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });

    return { success: true };

  } catch (error: any) {
    console.error(`Failed to check or create site for siteId "${siteId}":`, error);
    // In a real app, you might want to log this error
    return { success: false, error: 'Could not set up the site. Please try again.' };
  }
}
