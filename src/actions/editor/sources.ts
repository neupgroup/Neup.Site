
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, writeBatch, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';

export type SourceType = 'api' | 'database' | 'static' | 'datalist';

export interface SourceMethod {
    methodName: string;
    path: string;
    httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    // We can add more method-specific details here later
}

export interface BaseSource {
  id: string;
  siteId: string;
  name: string;
  type: SourceType;
  createdAt?: string | null;
  methods: SourceMethod[];
}

export interface ApiSource extends BaseSource {
  type: 'api';
  url: string;
  headers?: Record<string, string>;
}

export interface DatabaseSource extends BaseSource {
  type: 'database';
  connection: string;
}

export interface StaticSource extends BaseSource {
  type: 'static';
  data: Record<string, any>;
}

export interface DatalistSource extends BaseSource {
    type: 'datalist';
    datalistId: string;
}


export type Source = ApiSource | DatabaseSource | StaticSource | DatalistSource;


/**
 * Creates a new data source.
 */
export async function createSource(sourceData: Omit<Source, 'id' | 'createdAt' | 'siteId'>) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'sources'), {
      ...sourceData,
      siteId,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create source.' };
  }
}

/**
 * Fetches all data sources for the current siteId.
 */
export async function getSources(): Promise<{ success: boolean; sources?: Source[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'sources'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const sources = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        return {
            id: doc.id,
            ...data,
            methods: data.methods || [],
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Source
    });
    return { success: true, sources };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch sources.' };
  }
}


/**
 * Fetches a single data source by its ID.
 */
export async function getSource(id: string): Promise<{ success: boolean, source?: Source, error?: string }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };
    
    try {
        const { firestore } = initializeFirebase();
        const sourceRef = doc(firestore, 'sources', id);
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
            ...data,
            methods: data.methods || [],
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Source;
        return { success: true, source };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch source.' };
    }
}

/**
 * Updates a data source.
 */
export async function updateSource(id: string, sourceData: Partial<Omit<Source, 'id' | 'createdAt' | 'siteId'>>) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const sourceRef = doc(firestore, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);
    if (!sourceSnap.exists() || sourceSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }

    await setDoc(sourceRef, sourceData, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message || `Failed to update source ${id}.` };
  }
}


/**
 * Deletes a data source and its associated credentials.
 */
export async function deleteSource(id: string) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const sourceRef = doc(firestore, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);

    if (!sourceSnap.exists() || sourceSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }
    batch.delete(sourceRef);

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete source.' };
  }
}
