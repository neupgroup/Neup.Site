
'use server';

import { prisma as db } from '@neup/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { logger } from '@neup/logica/logger';
import { getActiveProjectId } from '@/services/projects';

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
    const projectId = await getActiveProjectId({ required: true });
    const record = await db.applicant.create({
      data: {
        job: { connect: { id: jobId, projectId } },
        name: data.name ?? '',
        email: data.email ?? '',
        resumeUrl: data.resumeUrl ?? null,
        coverLetter: data.coverLetter ?? null,
        status: 'New',
        appliedAt: new Date(),
      },
      select: { id: true },
    });
    revalidatePath(`/manage/hiring/${jobId}/applicants`);
    return { success: true, id: record.id };
  } catch (e: any) {
    await logger.error({ message: `Failed to create applicant for job ${jobId}: ${e.message}`, stack: e.stack, source: 'createApplicant' });
    return { success: false, error: 'Failed to create applicant.' };
  }
}

export async function getApplicantsForJob(jobId: string): Promise<{ success: boolean; applicants?: Applicant[]; error?: string }> {
  try {
    const projectId = await getActiveProjectId({ required: true });
    const records = await db.applicant.findMany({
      where: { jobId, job: { projectId } },
      orderBy: [{ appliedAt: 'desc' }, { id: 'asc' }],
    });
    const applicants = records.map((record) => ({
      id: record.id,
      jobId: record.jobId,
      name: record.name,
      email: record.email,
      status: record.status as Applicant['status'],
      resumeUrl: record.resumeUrl ?? undefined,
      coverLetter: record.coverLetter ?? undefined,
      appliedAt: record.appliedAt ? record.appliedAt.toISOString() : null,
    })) as Applicant[];
    return { success: true, applicants };
  } catch (e: any) {
    await logger.error({ message: `Failed to get applicants for job ${jobId}: ${e.message}`, stack: e.stack, source: 'getApplicantsForJob' });
    return { success: false, error: 'Failed to fetch applicants.' };
  }
}
