
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
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { logErrorToFirestore } from '@/lib/logging';

export interface JobPosting {
  id: string;
  title: string;
  location?: string;
  type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description?: string;
  status: 'Draft' | 'Open' | 'Closed';
  qualifications?: string[];
  salary?: string;
  openings?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function createJobPosting(data: Partial<Omit<JobPosting, 'id' | 'status'>>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'hiring'), {
      ...data,
      status: 'Draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/manage/hiring');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create job posting: ${e.message}`, stack: e.stack, source: 'createJobPosting' });
    return { success: false, error: 'Failed to create job posting.' };
  }
}

export async function getJobPostings(): Promise<{ success: boolean; postings?: JobPosting[]; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const querySnapshot = await getDocs(collection(firestore, 'hiring'));
    const postings = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      return {
        id: docSnap.id,
        title: data.title,
        location: data.location,
        type: data.type,
        description: data.description,
        status: data.status,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      } as JobPosting;
    });
    return { success: true, postings };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get job postings: ${e.message}`, stack: e.stack, source: 'getJobPostings' });
    return { success: false, error: 'Failed to fetch job postings.' };
  }
}

export async function getJobPostingById(id: string): Promise<{ success: boolean; posting?: JobPosting; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'hiring', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Job posting not found.' };
        }

        const data = docSnap.data();
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;

        const posting: JobPosting = {
            id: docSnap.id,
            title: data.title,
            location: data.location,
            type: data.type,
            description: data.description,
            status: data.status,
            qualifications: data.qualifications || [],
            salary: data.salary,
            openings: data.openings,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
        };
        return { success: true, posting };

    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get job posting ${id}: ${e.message}`, stack: e.stack, source: 'getJobPostingById' });
        return { success: false, error: 'Failed to fetch job posting.' };
    }
}

export async function updateJobPosting(id: string, data: Partial<Omit<JobPosting, 'id'>>): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'hiring', id);
        await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
        revalidatePath(`/manage/hiring`);
        revalidatePath(`/manage/hiring/${id}`);
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to update job posting ${id}: ${e.message}`, stack: e.stack, source: 'updateJobPosting' });
        return { success: false, error: 'Failed to update job posting.' };
    }
}

export async function deleteJobPosting(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        await deleteDoc(doc(firestore, 'hiring', id));
        revalidatePath('/manage/hiring');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to delete job posting ${id}: ${e.message}`, stack: e.stack, source: 'deleteJobPosting' });
        return { success: false, error: 'Failed to delete job posting.' };
    }
}
