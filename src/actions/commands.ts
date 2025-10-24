
'use server';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { ServerCommand } from '@/schemas/command';
import { logErrorToFirestore } from '@/lib/logging';

export async function createServerCommand(data: Omit<ServerCommand, 'id' | 'createdAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'serverCommands'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/root/command');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create server command: ${e.message}`, stack: e.stack, source: 'createServerCommand' });
    return { success: false, error: 'Failed to create command.' };
  }
}

export async function getServerCommands({
  searchQuery,
  page = 1,
  pageSize = 10
}: {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ success: boolean; commands?: ServerCommand[]; error?: string; totalCount?: number }> {
  try {
    const { firestore } = initializeFirebase();
    const commandsRef = collection(firestore, 'serverCommands');
    
    // For simplicity, we'll fetch all and filter in memory for search.
    // For a larger dataset, a dedicated search service like Algolia would be better.
    const allDocsQuery = query(commandsRef, orderBy('name'));
    const allDocsSnapshot = await getDocs(allDocsQuery);
    
    let allCommands = allDocsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdAt = data.createdAt;
        return {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            commandTemplate: data.commandTemplate,
            parameters: data.parameters || [],
            type: data.type || 'view',
            danger: data.danger || 'low',
            preprocess: data.preprocess ?? false,
            allocatesPort: data.allocatesPort ?? false,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as ServerCommand;
    });

    if (searchQuery) {
        allCommands = allCommands.filter(command =>
            command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (command.description && command.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    const totalCount = allCommands.length;
    const paginatedCommands = allCommands.slice((page - 1) * pageSize, page * pageSize);

    return { success: true, commands: paginatedCommands, totalCount };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get server commands: ${e.message}`, stack: e.stack, source: 'getServerCommands' });
    return { success: false, error: 'Failed to fetch commands.' };
  }
}

export async function getServerCommand(id: string): Promise<{ success: boolean; command?: ServerCommand; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverCommands', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Command not found.' };
        }

        const data = docSnap.data();
        const createdAt = data.createdAt;

        const command: ServerCommand = {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            commandTemplate: data.commandTemplate,
            parameters: data.parameters || [],
            type: data.type || 'view',
            danger: data.danger || 'low',
            preprocess: data.preprocess ?? false,
            allocatesPort: data.allocatesPort ?? false,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, command };

    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get server command ${id}: ${e.message}`, stack: e.stack, source: 'getServerCommand' });
        return { success: false, error: 'Failed to fetch command.' };
    }
}

export async function updateServerCommand(id: string, data: Partial<Omit<ServerCommand, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverCommands', id);
        await setDoc(docRef, data, { merge: true });
        revalidatePath('/root/command');
        revalidatePath(`/root/command/${id}`);
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to update server command ${id}: ${e.message}`, stack: e.stack, source: 'updateServerCommand' });
        return { success: false, error: 'Failed to update command.' };
    }
}

export async function deleteServerCommand(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        await deleteDoc(doc(firestore, 'serverCommands', id));
        revalidatePath('/root/command');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to delete server command ${id}: ${e.message}`, stack: e.stack, source: 'deleteServerCommand' });
        return { success: false, error: 'Failed to delete command.' };
    }
}

    