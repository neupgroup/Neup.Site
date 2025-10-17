'use server'

import { cookies } from 'next/headers'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
 
export async function setSiteIdCookie(siteId: string) {
  if (!siteId) {
    throw new Error('Site ID cannot be empty.');
  }
  
  try {
    const { firestore } = initializeFirebase();
    const siteRef = doc(firestore, 'sites', siteId);
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
    (await cookies()).set('siteId', siteId, {
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