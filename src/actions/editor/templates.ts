'use server';

import { db } from '@/lib/firebase';
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
} from 'firebase/firestore';
import type { Template } from '@/lib/schemas';
import { logErrorToFirestore } from '../logging';

const TEMPLATES_COLLECTION = 'templates';

/**
 * Saves or updates a template in Firestore.
 * If the template has an ID, it updates the existing document.
 * Otherwise, it creates a new one.
 */
export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt'>, id?: string) {
  try {
    if (id) {
      const templateRef = doc(db, TEMPLATES_COLLECTION, id);
      await setDoc(templateRef, {
        ...template,
        // Note: serverTimestamp() can't be used with setDoc on update in the same way.
        // We'll assume `createdAt` is only set on creation.
      }, { merge: true });
      return { success: true, id };
    } else {
      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
        ...template,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    console.error('Failed to save template:', error);
    await logErrorToFirestore({
      message: 'Failed to save template: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to save template.' };
  }
}

/**
 * Fetches all templates from Firestore.
 */
export async function getTemplates(): Promise<{ success: boolean, templates?: Template[], error?: string }> {
  try {
    const querySnapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    const templates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      // Convert Timestamp to a serializable format (ISO string)
      const serializableData = {
        ...data,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      };

      return {
        id: doc.id,
        ...serializableData,
      } as Template;
    });
    return { success: true, templates };
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    await logErrorToFirestore({
      message: 'Failed to fetch templates: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to fetch templates.' };
  }
}

/**
 * Fetches a single template from Firestore by its ID.
 */
export async function getTemplate(id: string): Promise<{ success: boolean, template?: Template, error?: string }> {
    try {
        const templateRef = doc(db, TEMPLATES_COLLECTION, id);
        const docSnap = await getDoc(templateRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Template not found.' };
        }
        
        const data = docSnap.data();
        const createdAt = data.createdAt;

        // Convert Timestamp to a serializable format (ISO string)
        const serializableData = {
            ...data,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };

        const template = { id: docSnap.id, ...serializableData } as Template;
        return { success: true, template };
    } catch (error: any) {
        console.error(`Failed to fetch template with ID ${id}:`, error);
        await logErrorToFirestore({
            message: `Failed to fetch template with ID ${id}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: error.message || 'Failed to fetch template.' };
    }
}


/**
 * Deletes a template from Firestore by its ID.
 */
export async function deleteTemplate(id: string) {
  try {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    await logErrorToFirestore({
      message: `Failed to delete template with ID ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to delete template.' };
  }
}
