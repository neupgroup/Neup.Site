
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
import { convertJsonToJsx } from '@/lib/json-to-jsx';
import { convertHtmlToJson } from '@/ai/flows/html-to-json-flow';

const TEMPLATES_COLLECTION = 'templates';


function isHtml(code: string): boolean {
    const trimmed = code.trim().toLowerCase();
    return trimmed.startsWith('<') && trimmed.endsWith('>');
}

function isJson(code: string): boolean {
    try {
        const parsed = JSON.parse(code);
        return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
        return false;
    }
}


/**
 * Saves or updates a template in Firestore.
 * If the template has an ID, it updates the existing document.
 * Otherwise, it creates a new one.
 */
export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt'>, id?: string) {
  try {
    let dataToSave: any = { ...template };
    
    if (dataToSave.method === 'codebase' && dataToSave.code) {
        if (isHtml(dataToSave.code)) {
            // AI conversion from HTML to JSON elements
            dataToSave.elements = await convertHtmlToJson(dataToSave.code);
        } else if (isJson(dataToSave.code)) {
            // Direct JSON for elements
            dataToSave.elements = JSON.parse(dataToSave.code);
        }
    } else if (dataToSave.method === 'textual' && dataToSave.code) {
        // Prepare for Handlebars-style looping
        dataToSave.code = dataToSave.code.replace(/\{\{/g, '{{item.').replace(/item\.item\./g, 'item.');
    }
    
    if (dataToSave.elements && dataToSave.elements.length > 0) {
        dataToSave.reactComponent = convertJsonToJsx(dataToSave.elements);
    }
      
    if (id) {
      const templateRef = doc(db, TEMPLATES_COLLECTION, id);
      await setDoc(templateRef, dataToSave, { merge: true });
      return { success: true, id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), dataToSave);
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
      
      const serializableData: Partial<Template> = {
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

        const serializableData: Partial<Template> = {
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
