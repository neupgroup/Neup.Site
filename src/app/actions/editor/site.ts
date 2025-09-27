'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';

export async function saveSite(elements: any) {
  try {
    const siteRef = doc(db, 'sites', 'published-site');
    await setDoc(siteRef, {
      elements,
      publishedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save site:', error);
    await logErrorToFirestore({
      message: 'Failed to save site: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to save site.' };
  }
}
