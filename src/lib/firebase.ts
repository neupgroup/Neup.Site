
'use client';

import { initializeFirebase } from '@/lib/firebase/index';

const { firestore, auth } = initializeFirebase();

export { firestore, auth };
