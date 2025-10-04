import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | undefined;

try {
  // Only initialize Firebase Admin if it hasn't been initialized yet
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.warn(
        'Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT environment variable is not set. Admin features will be unavailable.'
      );
    } else {
      // Parse the service account JSON
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // Fix the private_key formatting for escaped newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      // Get Firestore instance
      adminDb = getFirestore();
      console.log('✅ Firebase Admin initialized successfully');
    }
  } else {
    // If already initialized, just get Firestore
    adminDb = getFirestore();
  }
} catch (err: any) {
  console.error('🔥 Firebase Admin SDK Initialization Error:', err);
}

/**
 * Safe getter for Firestore instance.
 * Throws if Firebase Admin is not initialized properly.
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    throw new Error(
      'Firebase Admin SDK is not initialized. Check your FIREBASE_SERVICE_ACCOUNT env variable.'
    );
  }
  return adminDb;
}
