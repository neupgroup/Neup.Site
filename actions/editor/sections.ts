
'use server';

import { getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc, deleteDoc, serverTimestamp, Timestamp, query, where } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-store';

export interface Section {
  id: string;
  artifactId: string;
  name: string;
  description?: string;
  type: string;
  content: string; // JSON string
  source: 'json';
  createdBy: 'user' | 'ai';
  createdAt: string | null;
}

/**
 * Saves or updates a section in Firestore.
 */
export async function saveSection(section: Omit<Section, 'id' | 'createdAt' | 'artifactId'>, id?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    let dataToSave: any = {
      artifactId,
      name: section.name,
      type: section.type,
      content: section.content,
      source: 'json',
      createdBy: section.createdBy,
    };

    if (id) {
      const sectionRef = doc(firestore, 'sections', id);
      const sectionSnap = await getDoc(sectionRef);
      if (!sectionSnap.exists() || sectionSnap.data().artifactId !== artifactId) {
        return { success: false, error: 'Unauthorized.' };
      }
      await setDoc(sectionRef, dataToSave, { merge: true });
      return { success: true, id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(firestore, 'sections'), dataToSave);
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    return { success: false, error: 'Failed to save section. An error has been logged.' };
  }
}

/**
 * Fetches all sections from Firestore for the current artifactId.
 */
export async function getSections(): Promise<{ success: boolean; sections?: Section[]; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const q = query(collection(firestore, 'sections'), where('artifactId', '==', artifactId));
    const querySnapshot = await getDocs(q);
    const sections = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;

      const section: Section = {
        id: docSnap.id,
        artifactId: data.artifactId,
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
    return { success: false, error: 'Failed to fetch sections. An error has been logged.' };
  }
}

/**
 * Fetches a single section from Firestore by its ID.
 */
export async function getSection(id: string): Promise<{ success: boolean; section?: Section; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const sectionRef = doc(firestore, 'sections', id);
    const docSnap = await getDoc(sectionRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Section not found.' };
    }

    const data = docSnap.data();
    if (data.artifactId !== artifactId) {
      return { success: false, error: 'Unauthorized.' };
    }

    const createdAt = data.createdAt;

    const section: Section = {
      id: docSnap.id,
      artifactId: data.artifactId,
      name: data.name || '',
      type: data.type || '',
      content: data.content || '{}',
      source: 'json',
      createdBy: data.createdBy || 'user',
      createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
    };
    return { success: true, section };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch section. An error has been logged.' };
  }
}

/**
 * Deletes a section from Firestore by its ID.
 */
export async function deleteSection(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const sectionRef = doc(firestore, 'sections', id);
    const sectionSnap = await getDoc(sectionRef);
    if (!sectionSnap.exists() || sectionSnap.data().artifactId !== artifactId) {
      return { success: false, error: 'Unauthorized.' };
    }
    await deleteDoc(sectionRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to delete section with ID ${id}. An error has been logged.` };
  }
}
