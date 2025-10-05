
'use server';

import { getFirestore, doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import type { Structure, PathStructure, Page } from '@/schemas/site';
import { logErrorToFirestore } from '@/lib/logging';
import { getPages } from './editor/pages';

/**
 * Gets the deployment structure for the current site.
 */
export async function getStructure(): Promise<{ success: boolean; structure?: Structure; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    const docSnap = await getDoc(structureRef);

    if (!docSnap.exists()) {
      return { success: true, structure: undefined };
    }

    const data = docSnap.data();
    const structure: Structure = {
      id: docSnap.id,
      siteId: data.siteId,
      status: data.status,
      structure: data.structure || [],
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    };
    return { success: true, structure };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to get structure: ${error.message}`, stack: error.stack, source: 'getStructure' });
    return { success: false, error: 'Failed to get structure.' };
  }
}

/**
 * Compiles pages and paths into a structure document, marking it as pending deployment.
 */
export async function buildStructure(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const { success, pages, error } = await getPages();

    if (!success) {
      return { success: false, error: error || 'Failed to fetch pages for build.' };
    }

    const structureDoc: PathStructure[] = [];
    if (pages) {
      for (const page of pages) {
        if (page.paths && page.paths.length > 0) {
          for (const path of page.paths) {
            structureDoc.push({
              path: path.path,
              pageId: page.id,
              sections: page.elements.map(el => el.id),
              theme: {}, // Placeholder for future theme overrides
              changesMade: true, // Always mark as changed on a fresh build
            });
          }
        }
      }
    }
    
    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, {
        siteId,
        structure: structureDoc,
        status: 'pendingDeployment',
        updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to build structure: ${error.message}`, stack: error.stack, source: 'buildStructure' });
    return { success: false, error: 'Failed to build site structure.' };
  }
}


/**
 * Marks the structure as deployed.
 */
export async function deployStructure(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    const structureSnap = await getDoc(structureRef);

    if (!structureSnap.exists()) {
        return { success: false, error: 'No structure found to deploy. Please build first.'};
    }

    const currentStructure = structureSnap.data() as Structure;
    const updatedPaths = currentStructure.structure.map(p => ({...p, changesMade: false}));

    await setDoc(structureRef, {
        status: 'deployed',
        structure: updatedPaths,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to deploy structure: ${error.message}`, stack: error.stack, source: 'deployStructure' });
    return { success: false, error: 'Failed to deploy site structure.' };
  }
}


/**
 * Marks specific paths as changed and sets the structure status to pendingDeployment.
 */
export async function markStructureAsPending(siteId: string, paths: string[], isDeletion: boolean = false): Promise<void> {
    try {
        const { firestore } = initializeFirebase();
        const structureRef = doc(firestore, 'structure', siteId);
        const structureSnap = await getDoc(structureRef);

        let finalStructure: PathStructure[] = [];

        if (structureSnap.exists()) {
            const currentStructure = structureSnap.data() as Omit<Structure, 'id'>;
            finalStructure = currentStructure.structure.map(p => {
                if (paths.includes(p.path)) {
                    return { ...p, changesMade: true };
                }
                return p;
            });
            // If a path was deleted, filter it out
            if (isDeletion) {
                finalStructure = finalStructure.filter(p => !paths.includes(p.path));
            }
        } else if (!isDeletion) {
            // If structure doesn't exist and we are adding/updating, create entries
            const { pages } = await getPages();
            const pagesWithPaths = pages?.filter(p => p.paths && p.paths.some(pathInfo => paths.includes(pathInfo.path))) || [];

            for (const page of pagesWithPaths) {
                 for (const pathInfo of page.paths!) {
                     if(paths.includes(pathInfo.path)) {
                        finalStructure.push({
                            path: pathInfo.path,
                            pageId: page.id,
                            sections: page.elements.map(el => el.id),
                            theme: {},
                            changesMade: true,
                        });
                     }
                 }
            }
        }
        
        await setDoc(structureRef, {
            siteId: siteId,
            status: 'pendingDeployment',
            structure: finalStructure,
            updatedAt: serverTimestamp()
        }, { merge: true });

    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to mark structure as pending: ${error.message}`,
            stack: error.stack,
            source: 'markStructureAsPending'
        });
    }
}
