'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LogErrorParams {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  details?: string;
}

export async function logErrorToFirestore(error: LogErrorParams): Promise<void> {
  try {
    const errorsCollectionRef = collection(db, 'errors');
    await addDoc(errorsCollectionRef, {
      ...error,
      source: error.source || 'unknown',
      timestamp: serverTimestamp(),
    });
  } catch (dbError: any) {
    console.error('Failed to log error to Firestore:', dbError.message);
    // As this is a logging function, throwing an error here could cause a loop.
    // The primary error is logged to the server console, which should be sufficient.
  }
}
