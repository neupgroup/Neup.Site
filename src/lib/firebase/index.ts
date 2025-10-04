
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

function initializeFirebase() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  const app = getApp();
  const firestore = getFirestore(app);
  
  return { app, firestore };
}

export { initializeFirebase };
