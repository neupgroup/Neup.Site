
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
  writeBatch,
} from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/schemas/member';
import { logErrorToDatabase } from '@/lib/logging';

export async function createMember(data: Omit<Member, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'members'), data);
    revalidatePath('/manage/members');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create member: ${e.message}`, stack: e.stack, source: 'createMember' });
    return { success: false, error: 'Failed to create member.' };
  }
}

export async function getMembers(): Promise<{ success: boolean; members?: Member[]; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const querySnapshot = await getDocs(collection(firestore, 'members'));
    const members = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        imageUrl: data.imageUrl,
        teamIds: data.teamIds || [],
      } as Member;
    });
    return { success: true, members };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get members: ${e.message}`, stack: e.stack, source: 'getMembers' });
    return { success: false, error: 'Failed to fetch members.' };
  }
}

export async function getMember(id: string): Promise<{ success: boolean; member?: Member; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const docRef = doc(firestore, 'members', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Member not found.' };
    }

    const data = docSnap.data();
    const member: Member = {
      id: docSnap.id,
      name: data.name,
      email: data.email,
      role: data.role,
      imageUrl: data.imageUrl,
      teamIds: data.teamIds || [],
    };
    return { success: true, member };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get member ${id}: ${e.message}`, stack: e.stack, source: 'getMember' });
    return { success: false, error: 'Failed to fetch member.' };
  }
}

export async function updateMember(id: string, data: Partial<Omit<Member, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const memberRef = doc(firestore, 'members', id);
    await setDoc(memberRef, data, { merge: true });
    revalidatePath(`/manage/members`);
    revalidatePath(`/manage/members/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update member ${id}: ${e.message}`, stack: e.stack, source: 'updateMember' });
    return { success: false, error: 'Failed to update member.' };
  }
}

export async function deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = getDataStore();
    await deleteDoc(doc(firestore, 'members', id));
    revalidatePath('/manage/members');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete member ${id}: ${e.message}`, stack: e.stack, source: 'deleteMember' });
    return { success: false, error: 'Failed to delete member.' };
  }
}
