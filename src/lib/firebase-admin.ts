
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    if (!serviceAccount) {
      console.error('Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT environment variable is not set or is empty.');
    } else {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

try {
    adminDb = getFirestore();
} catch (error) {
    console.error("Failed to get Firestore instance. Make sure Firebase Admin is initialized.", error);
    // Fallback or re-throw as appropriate for your error handling strategy
}


export { adminDb };
