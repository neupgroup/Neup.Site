
'use server'

import { cookies } from 'next/headers'
import { adminDb } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
 
export async function setSiteIdCookie(siteId: string) {
  if (!siteId) {
    throw new Error('Site ID cannot be empty.');
  }

  // Reference to the document in the 'sites' collection
  const siteRef = doc(adminDb, 'sites', siteId);

  try {
    const docSnap = await getDoc(siteRef);

    // If the document does not exist, create it.
    if (!docSnap.exists()) {
      await setDoc(siteRef, {
        id: siteId,
        name: siteId, // Default name to the siteId
        status: 'active', // Default status
        type: 'corporate portfolio', // Default type
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
