
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
  query
} from 'firebase/firestore';
import { Template } from '@/schemas/template';
import { logErrorToFirestore } from '@/lib/logging';

/**
 * Saves or updates a template in Firestore.
 */
export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'siteId'>, id?: string) {
  try {
    const adminDb = getAdminDb();
    let dataToSave: any = { 
        name: template.name,
        description: template.description || '',
        imageUrl: template.imageUrl,
        previewUrl: template.previewUrl,
        category: template.category,
        type: template.type || 'section',
        usableOn: template.usableOn || ['json'],
        elements: template.elements || [],
        reactComponent: template.reactComponent || '',
        createdBy: template.createdBy || 'user',
    };
      
    if (id) {
      const templateRef = doc(adminDb, 'templates', id);
      await setDoc(templateRef, dataToSave, { merge: true });
      return { success: true, id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(adminDb, 'templates'), dataToSave);
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to save template: ${error.message}`,
        stack: error.stack,
        source: 'saveTemplate',
    });
    return { success: false, error: 'Failed to save template. An error has been logged.' };
  }
}


/**
 * Fetches all templates from Firestore.
 */
export async function getTemplates(): Promise<{ success: boolean, templates?: Template[], error?: string }> {
  try {
    const adminDb = getAdminDb();
    const q = query(collection(adminDb, 'templates'));
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      const plainTemplate: Template = {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl,
        previewUrl: data.previewUrl,
        category: data.category,
        type: data.type || 'section',
        usableOn: data.usableOn || ['json'],
        elements: data.elements || [],
        reactComponent: data.reactComponent || '',
        createdBy: data.createdBy,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      };
      return plainTemplate;
    });
    return { success: true, templates };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to fetch templates: ${error.message}`,
        stack: error.stack,
        source: 'getTemplates',
    });
    return { success: false, error: 'Failed to fetch templates. An error has been logged.' };
  }
}

/**
 * Fetches a single template from Firestore by its ID.
 */
export async function getTemplate(id: string): Promise<{ success: boolean, template?: Template, error?: string }> {
    try {
        const adminDb = getAdminDb();
        const templateRef = doc(adminDb, 'templates', id);
        const docSnap = await getDoc(templateRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Template not found.' };
        }
        
        const data = docSnap.data();
        const createdAt = data.createdAt;
        
        const template: Template = { 
            id: docSnap.id, 
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl,
            previewUrl: data.previewUrl,
            category: data.category,
            type: data.type || 'section',
            usableOn: data.usableOn || ['json'],
            elements: data.elements || [],
            reactComponent: data.reactComponent || '',
            createdBy: data.createdBy || 'user',
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, template };
    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch template with ID ${id}: ${error.message}`,
            stack: error.stack,
            source: 'getTemplate',
        });
        return { success: false, error: 'Failed to fetch template. An error has been logged.' };
    }
}


/**
 * Deletes a template from Firestore by its ID.
 */
export async function deleteTemplate(id: string) {
  try {
    const adminDb = getAdminDb();
    const templateRef = doc(adminDb, 'templates', id);
    await deleteDoc(templateRef);
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to delete template with ID ${id}: ${error.message}`,
        stack: error.stack,
        source: 'deleteTemplate',
    });
    return { success: false, error: `Failed to delete template with ID ${id}. An error has been logged.` };
  }
}
