
'use server';

import { getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc, deleteDoc, serverTimestamp, Timestamp, query } from '@/lib/firestore';
import { Template } from '@/schemas/template';
import { getDataStore } from '@/lib/data-store';
import { logErrorToDatabase } from '@/lib/logging';

/**
 * Saves or updates a template in Firestore.
 */
export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt'>, id?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = getDataStore();
    
    // Ensure no undefined values are sent to Firestore.
    const dataToSave: any = { 
        name: template.name,
        description: template.description || '',
        imageUrl: template.imageUrl || null,
        previewUrl: template.previewUrl || null,
        category: template.category || null,
        type: template.type || 'section',
        status: template.status || 'draft',
        usableOn: template.usableOn || ['json'],
        content: template.content || {},
        createdBy: template.createdBy || 'user',
    };
      
    if (id) {
      const templateRef = doc(firestore, 'templates', id);
      await setDoc(templateRef, dataToSave, { merge: true });
      return { success: true, id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(firestore, 'templates'), dataToSave);
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    await logErrorToDatabase({
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
    const { firestore } = getDataStore();
    const q = query(collection(firestore, 'templates'));
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
        status: data.status || 'draft',
        usableOn: data.usableOn || ['json'],
        content: data.content || {},
        createdBy: data.createdBy,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      };
      return plainTemplate;
    });
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch templates. An error has been logged.' };
  }
}

/**
 * Fetches a single template from Firestore by its ID.
 */
export async function getTemplate(id: string): Promise<{ success: boolean, template?: Template, error?: string }> {
    try {
        const { firestore } = getDataStore();
        const templateRef = doc(firestore, 'templates', id);
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
            status: data.status || 'draft',
            usableOn: data.usableOn || ['json'],
            content: data.content || {},
            createdBy: data.createdBy || 'user',
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, template };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch template. An error has been logged.' };
    }
}


/**
 * Deletes a template from Firestore by its ID.
 */
export async function deleteTemplate(id: string) {
  try {
    const { firestore } = getDataStore();
    const templateRef = doc(firestore, 'templates', id);
    await deleteDoc(templateRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to delete template with ID ${id}. An error has been logged.` };
  }
}
