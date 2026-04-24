
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
} from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { revalidatePath } from 'next/cache';
import { logErrorToDatabase } from '@/lib/logging';

export interface Applicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'New' | 'Reviewing' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  appliedAt: string | null;
}

export async function createApplicant(jobId: string, data: Partial<Omit<Applicant, 'id' | 'jobId' | 'status' | 'appliedAt'>>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, `hiring/${jobId}/applicants`), {
      ...data,
      jobId,
      status: 'New',
      appliedAt: serverTimestamp(),
    });
    revalidatePath(`/manage/hiring/${jobId}/applicants`);
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create applicant for job ${jobId}: ${e.message}`, stack: e.stack, source: 'createApplicant' });
    return { success: false, error: 'Failed to create applicant.' };
  }
}

export async function getApplicantsForJob(jobId: string): Promise<{ success: boolean; applicants?: Applicant[]; error?: string }> {
  try {
    const { firestore } = getDataStore();
    const q = query(collection(firestore, `hiring/${jobId}/applicants`));
    const querySnapshot = await getDocs(q);
    const applicants = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const appliedAt = data.appliedAt;
      return {
        id: docSnap.id,
        jobId: data.jobId,
        name: data.name,
        email: data.email,
        status: data.status,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter,
        appliedAt: appliedAt instanceof Timestamp ? appliedAt.toDate().toISOString() : null,
      } as Applicant;
    });
    return { success: true, applicants };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get applicants for job ${jobId}: ${e.message}`, stack: e.stack, source: 'getApplicantsForJob' });
    return { success: false, error: 'Failed to fetch applicants.' };
  }
}
