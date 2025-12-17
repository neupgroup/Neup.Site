
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { errorEmitter } from './error-emitter';

interface FirebaseInstances {
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
}

function initializeFirebase(): FirebaseInstances {
  try {
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
    const app = getApp();
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    return { app, firestore, auth, storage };
  } catch (e: any) {
    // Emit a generic error if Firebase initialization fails.
    // This is a critical error, so it should be handled globally.
    errorEmitter.emit('error', new Error(`Firebase initialization failed: ${e.message}`));
    
    // You might want to re-throw or handle this differently depending on your app's needs.
    // For now, we'll throw to make it visible during development.
    throw new Error(`Firebase initialization failed: ${e.message}`);
  }
}

export { initializeFirebase };
