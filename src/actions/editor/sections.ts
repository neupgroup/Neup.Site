
'use server';

import { getAdminDb } from '@/lib/firebase/firebase-admin';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { logErrorToFirestore } from '@/lib/logging';
import { cookies } from 'next/headers';

export interface Section {
  id: string;
  siteId: string;
  name: string;
  type: string;
  content: string; // JSON string
  source: 'json';
  createdBy: 'user' | 'ai';
  createdAt: string | null;
}

/**
 * Saves or updates a section in Firestore.
 */
export async function saveSection(section: Omit<Section, 'id' | 'createdAt' | 'siteId'>, id?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const adminDb = getAdminDb();
    let dataToSave: any = {
        siteId,
        name: section.name,
        type: section.type,
        content: section.content,
        source: 'json',
        createdBy: section.createdBy,
    };
      
    if (id) {
      const sectionRef = doc(adminDb, 'sections', id);
      const sectionSnap = await getDoc(sectionRef);
      if (!sectionSnap.exists() || sectionSnap.data().siteId !== siteId) {
          return { success: false, error: 'Unauthorized.' };
      }
      await setDoc(sectionRef, dataToSave, { merge: true });
      return { success: true, id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(adminDb, 'sections'), dataToSave);
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to save section: ${error.message}`,
        stack: error.stack,
        source: 'saveSection',
    });
    return { success: false, error: 'Failed to save section. An error has been logged.' };
  }
}

/**
 * Fetches all sections from Firestore for the current siteId.
 */
export async function getSections(): Promise<{ success: boolean; sections?: Section[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const adminDb = getAdminDb();
    const q = query(collection(adminDb, 'sections'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const sections = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      
      const section: Section = {
        id: docSnap.id,
        siteId: data.siteId,
        name: data.name || '',
        type: data.type || '',
        content: data.content || '{}',
        source: 'json',
        createdBy: data.createdBy || 'user',
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      };
      return section;
    });
    return { success: true, sections };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to fetch sections: ${error.message}`,
        stack: error.stack,
        source: 'getSections',
    });
    return { success: false, error: 'Failed to fetch sections. An error has been logged.' };
  }
}

/**
 * Fetches a single section from Firestore by its ID.
 */
export async function getSection(id: string): Promise<{ success: boolean; section?: Section; error?: string }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const adminDb = getAdminDb();
        const sectionRef = doc(adminDb, 'sections', id);
        const docSnap = await getDoc(sectionRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Section not found.' };
        }
        
        const data = docSnap.data();
        if (data.siteId !== siteId) {
            return { success: false, error: 'Unauthorized.' };
        }

        const createdAt = data.createdAt;
        
        const section: Section = { 
            id: docSnap.id, 
            siteId: data.siteId,
            name: data.name || '',
            type: data.type || '',
            content: data.content || '{}',
            source: 'json',
            createdBy: data.createdBy || 'user',
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, section };
    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch section with ID ${id}: ${error.message}`,
            stack: error.stack,
            source: 'getSection',
        });
        return { success: false, error: 'Failed to fetch section. An error has been logged.' };
    }
}

/**
 * Deletes a section from Firestore by its ID.
 */
export async function deleteSection(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const adminDb = getAdminDb();
    const sectionRef = doc(adminDb, 'sections', id);
    const sectionSnap = await getDoc(sectionRef);
    if (!sectionSnap.exists() || sectionSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized.' };
    }
    await deleteDoc(sectionRef);
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to delete section with ID ${id}: ${error.message}`,
        stack: error.stack,
        source: 'deleteSection',
    });
    return { success: false, error: `Failed to delete section with ID ${id}. An error has been logged.` };
  }
}
