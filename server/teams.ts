
'use server';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  query,
  orderBy,
} from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { revalidatePath } from 'next/cache';
import type { Team } from '@/schemas/team';
import { logErrorToDatabase } from '@/lib/logging';

export async function createTeam(data: Omit<Team, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'teams'), data);
    revalidatePath('/manage/team');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create team: ${e.message}`, stack: e.stack, source: 'createTeam' });
    return { success: false, error: 'Failed to create team.' };
  }
}

export async function getTeams(): Promise<{ success: boolean; teams?: Team[]; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const q = query(collection(firestore, 'teams'), orderBy('order'));
    const querySnapshot = await getDocs(q);
    const teams = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        order: data.order,
      } as Team;
    });
    return { success: true, teams };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get teams: ${e.message}`, stack: e.stack, source: 'getTeams' });
    return { success: false, error: 'Failed to fetch teams.' };
  }
}

export async function getTeam(id: string): Promise<{ success: boolean; team?: Team; error?: string }> {
    try {
        const { firestore } = getDataStore();
        const docRef = doc(firestore, 'teams', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Team not found.' };
        }

        const data = docSnap.data();
        const team: Team = {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            order: data.order,
        };
        return { success: true, team };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get team ${id}: ${e.message}`, stack: e.stack, source: 'getTeam' });
        return { success: false, error: 'Failed to fetch team.' };
    }
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const teamRef = doc(firestore, 'teams', id);
    await setDoc(teamRef, data, { merge: true });
    revalidatePath('/manage/team');
    revalidatePath(`/manage/team/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update team ${id}: ${e.message}`, stack: e.stack, source: 'updateTeam' });
    return { success: false, error: 'Failed to update team.' };
  }
}

export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = getDataStore();
    await deleteDoc(doc(firestore, 'teams', id));
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete team ${id}: ${e.message}`, stack: e.stack, source: 'deleteTeam' });
    return { success: false, error: 'Failed to delete team.' };
  }
}
