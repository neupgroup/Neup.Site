
'use server'

import { cookies } from 'next/headers'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';

export async function setArtifactIdCookie(artifactId: string) {
  if (!artifactId) {
    throw new Error('Artifact ID cannot be empty.');
  }

  try {
    const { firestore } = getDataStore();
    const artifactRef = doc(firestore, 'artifacts', artifactId);
    const docSnap = await getDoc(artifactRef);

    // If the document does not exist, create it.
    if (!docSnap.exists()) {
      await setDoc(artifactRef, {
        id: artifactId,
        name: artifactId, // Default name to the artifactId
        status: 'active', // Default status
        type: 'corporate portfolio', // Default type
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Set the cookie after ensuring the artifact document exists
    (await cookies()).set('artifactId', artifactId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });

    return { success: true };

  } catch (error: any) {
    console.error(`Failed to check or create artifact for artifactId "${artifactId}":`, error);
    // In a real app, you might want to log this error
    return { success: false, error: 'Could not set up the artifact. Please try again.' };
  }
}
