
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface LogErrorParams {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  details?: string;
}

export async function logErrorToFirestore(error: LogErrorParams): Promise<void> {
  try {
    const errorsCollectionRef = adminDb.collection('errors');
    await errorsCollectionRef.add({
      ...error,
      source: error.source || 'unknown',
      timestamp: Timestamp.now(),
    });
  } catch (dbError: any) {
    console.error('Failed to log error to Firestore:', dbError.message);
    // As this is a logging function, throwing an error here could cause a loop.
    // The primary error is logged to the server console, which should be sufficient.
  }
}
