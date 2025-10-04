
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (!serviceAccount) {
    console.error('Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT environment variable is not set or is empty.');
    // In a local dev environment, this might not be a fatal error if emulators are used,
    // but for production, this is critical.
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
    throw new Error('Firebase Admin SDK failed to initialize. Check server logs for details.');
  }
}

try {
  initializeAdminApp();
  adminDb = getFirestore();
} catch (error) {
    console.error("Failed to get Firestore instance during initial load.", error);
    // We will attempt to get it again on-demand in the exported object.
}

export { adminDb };
