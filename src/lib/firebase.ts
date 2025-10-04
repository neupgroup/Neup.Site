
'use client';

import { initializeFirebase } from '@/firebase';

const { db, auth } = initializeFirebase();

export { db, auth };
