'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function logErrorToFirestore(error: {
  message: string;
  stack?: string;
  componentStack?: string;
}) {
  try {
    const errorsCollectionRef = collection(db, 'errors');
    await addDoc(errorsCollectionRef, {
      message: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      timestamp: serverTimestamp(),
      source: 'client-action',
    });
  } catch (dbError: any) {
    console.error('Failed to log error to Firestore:', dbError);
    // We can't throw here, or we might get into a loop.
    // The error is already logged to the console on the server.
  }
}
