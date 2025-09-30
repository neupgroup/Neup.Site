
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

// Basic interfaces based on your schema
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
export async function createSource(sourceData: Omit<Source, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'sources'), {
      ...sourceData,
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
 * Fetches all data sources.
 */
export async function getSources(): Promise<{ success: boolean; sources?: Source[]; error?: string }> {
  try {
    const querySnapshot = await getDocs(collection(db, 'sources'));
    const sources = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        return {
            id: doc.id,
            ...data,
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
    try {
        const sourceRef = doc(db, 'sources', id);
        const docSnap = await getDoc(sourceRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Source not found.' };
        }
        
        const data = docSnap.data();
        const createdAt = data.createdAt;

        const source = { 
            id: docSnap.id, 
            ...data,
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
export async function updateSource(id: string, sourceData: Partial<Omit<Source, 'id' | 'createdAt'>>) {
  try {
    const sourceRef = doc(db, 'sources', id);
    await setDoc(sourceRef, sourceData, { merge: true });
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
  try {
    const batch = writeBatch(db);

    // Delete the source document
    const sourceRef = doc(db, 'sources', id);
    batch.delete(sourceRef);

    // Find and delete all credentials for this source
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

// Functions for source credentials can be added here as needed
// e.g., addSourceCredential, getSourceCredentials, etc.
