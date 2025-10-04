
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore;

try {
    // Check if the app is already initialized to prevent re-initialization errors.
    if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : null;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // Log a warning if the service account is not set.
            // This is expected in a development environment where the variable may not be set,
            // but the app should not crash.
            console.warn('Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT environment variable is not set. Admin features will be unavailable.');
        }
    }
    
    // Only attempt to get Firestore if an app has been successfully initialized.
    if (admin.apps.length > 0) {
        adminDb = getFirestore();
    }

} catch (error: any) {
    console.error('Firebase Admin SDK Initialization Error:', error);
}

// @ts-ignore - adminDb might be uninitialized if the SDK setup fails, which is handled by consumers.
export { adminDb };
