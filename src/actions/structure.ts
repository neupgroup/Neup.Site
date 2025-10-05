
'use server';

import { getFirestore, doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import type { Structure, PathStructure, Deployment, Site } from '@/schemas/site';
import { logErrorToFirestore } from '@/lib/logging';
import { getPages } from './editor/pages';
import { getSite } from './editor/site';


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
 * Gets the last successful deployment record for the current site.
 */
export async function getLastDeployment(): Promise<{ success: boolean; deployment?: Deployment; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const deploymentsRef = collection(firestore, 'deployments');
    const q = query(
      deploymentsRef,
      where('siteId', '==', siteId),
      where('status', '==', 'deployed'),
      orderBy('attemptedOn', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, deployment: undefined };
    }
    
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    const deployment: Deployment = {
        id: docSnap.id,
        siteId: data.siteId,
        structure: data.structure || [],
        status: data.status,
        theme: data.theme,
        attemptedOn: data.attemptedOn instanceof Timestamp ? data.attemptedOn.toDate().toISOString() : null,
    };
    return { success: true, deployment };

  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to get last deployment: ${error.message}`, stack: error.stack, source: 'getLastDeployment' });
    return { success: false, error: 'Failed to get last deployment.' };
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
 * Creates a new deployment record and marks the structure as deployed.
 */
export async function createDeployment(): Promise<{ success: boolean; error?: string }> {
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

    const { site } = await getSite();
    const currentStructure = structureSnap.data() as Structure;

    // Create a new document in the 'deployments' collection
    await addDoc(collection(firestore, 'deployments'), {
      siteId,
      structure: currentStructure.structure,
      status: 'deployed',
      theme: site?.theme || {},
      attemptedOn: serverTimestamp(),
    });

    // Reset the staging structure
    const updatedPaths = currentStructure.structure.map(p => ({...p, changesMade: false}));
    await setDoc(structureRef, {
        status: 'deployed',
        structure: updatedPaths,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to create deployment: ${error.message}`, stack: error.stack, source: 'createDeployment' });
    return { success: false, error: 'Failed to create deployment record.' };
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
