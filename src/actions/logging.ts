'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { LogErrorParams } from '@/schemas/logging';

export async function logErrorToFirestore(error: LogErrorParams): Promise<void> {
  try {
    const errorsCollectionRef = getAdminDb.collection('errors');
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
