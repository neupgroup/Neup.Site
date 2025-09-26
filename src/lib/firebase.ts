
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-8995414118-509c1",
  "appId": "1:491020006623:web:1f033cd55836b8eabde56a",
  "apiKey": "AIzaSyBr7KeAgIJ10FwFJw2vlwV379G7fJ1MB7Q",
  "authDomain": "studio-8995414118-509c1.firebaseapp.com",
  "messagingSenderId": "491020006623"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
