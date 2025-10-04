
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import { cookies } from 'next/headers';

export interface SourceMethod {
  methodName: string;
  subPath: string;
  responseFormat: {
    correct: string;
    incorrect: string;
  };
  moreDetails: string;
}

export interface Source {
  id: string;
  siteId: string;
  name: string;
  basePath: string;
  methods: SourceMethod[];
  permitControl: boolean;
  ownedBy: string;
  createdAt?: string | null;
}

export interface SourceCredential {
  id: string;
  sourceId: string;
  credentials: { name: string; value: string }[];
}

/**
 * Creates a new data source.
 */
export async function createSource(sourceData: Omit<Source, 'id' | 'createdAt' | 'siteId'>) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const docRef = await addDoc(collection(db, 'sources'), {
      ...sourceData,
      siteId,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Failed to create source:', error);
    await logErrorToFirestore({
      message: 'Failed to create source: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to create source.' };
  }
}

/**
 * Fetches all data sources for the current siteId.
 */
export async function getSources(): Promise<{ success: boolean; sources?: Source[]; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const q = query(collection(db, 'sources'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const sources = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        return {
            id: doc.id,
            siteId: data.siteId,
            name: data.name,
            basePath: data.basePath,
            methods: data.methods || [],
            permitControl: data.permitControl,
            ownedBy: data.ownedBy,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Source
    });
    return { success: true, sources };
  } catch (error: any) {
    console.error('Failed to fetch sources:', error);
    await logErrorToFirestore({
      message: 'Failed to fetch sources: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to fetch sources.' };
  }
}


/**
 * Fetches a single data source by its ID.
 */
export async function getSource(id: string): Promise<{ success: boolean, source?: Source, error?: string }> {
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };
    
    try {
        const sourceRef = doc(db, 'sources', id);
        const docSnap = await getDoc(sourceRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Source not found.' };
        }
        
        const data = docSnap.data();
        if (data.siteId !== siteId) {
            return { success: false, error: 'Unauthorized.' };
        }

        const createdAt = data.createdAt;
        const source = { 
            id: docSnap.id, 
            siteId: data.siteId,
            name: data.name,
            basePath: data.basePath,
            methods: data.methods || [],
            permitControl: data.permitControl,
            ownedBy: data.ownedBy,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Source;
        return { success: true, source };
    } catch (error: any) {
        console.error(`Failed to fetch source with ID ${id}:`, error);
        await logErrorToFirestore({
            message: `Failed to fetch source with ID ${id}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: error.message || 'Failed to fetch source.' };
    }
}

/**
 * Updates a data source.
 */
export async function updateSource(id: string, sourceData: Partial<Omit<Source, 'id' | 'createdAt' | 'siteId'>>) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const sourceRef = doc(db, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);
    if (!sourceSnap.exists() || sourceSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }

    const dataToUpdate = {
        ...sourceData,
        methods: sourceData.methods || [],
    };
    await setDoc(sourceRef, dataToUpdate, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    console.error(`Failed to update source ${id}:`, error);
    await logErrorToFirestore({
      message: `Failed to update source ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || `Failed to update source ${id}.` };
  }
}


/**
 * Deletes a data source and its associated credentials.
 */
export async function deleteSource(id: string) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const batch = writeBatch(db);
    const sourceRef = doc(db, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);

    if (!sourceSnap.exists() || sourceSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }
    batch.delete(sourceRef);

    const credsQuery = query(collection(db, 'sourceCredentials'), where('sourceId', '==', id));
    const credsSnapshot = await getDocs(credsQuery);
    credsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete source with ID ${id}:`, error);
    await logErrorToFirestore({
      message: `Failed to delete source with ID ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to delete source.' };
  }
}
