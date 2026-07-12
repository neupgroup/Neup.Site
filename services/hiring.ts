
'use server';

import { prisma as db } from '@/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { logErrorToDatabase } from '@/core/helpers/logger';

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
    const now = new Date();
    const record = await db.jobPosting.create({
      data: {
        title: data.title ?? '',
        location: data.location ?? null,
        type: data.type ?? null,
        description: data.description ?? null,
        status: 'Draft',
        qualifications: data.qualifications ? (data.qualifications as any) : undefined,
        salary: data.salary ?? null,
        openings: data.openings ?? null,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    revalidatePath('/manage/hiring');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create job posting: ${e.message}`, stack: e.stack, source: 'createJobPosting' });
    return { success: false, error: 'Failed to create job posting.' };
  }
}

export async function getJobPostings(): Promise<{ success: boolean; postings?: JobPosting[]; error?: string }> {
  try {
    const records = await db.jobPosting.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const postings = records.map((record) => ({
      id: record.id,
      title: record.title,
      location: record.location ?? undefined,
      type: (record.type as JobPosting['type']) ?? undefined,
      description: record.description ?? undefined,
      status: record.status as JobPosting['status'],
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    })) as JobPosting[];
    return { success: true, postings };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get job postings: ${e.message}`, stack: e.stack, source: 'getJobPostings' });
    return { success: false, error: 'Failed to fetch job postings.' };
  }
}

export async function getJobPostingById(id: string): Promise<{ success: boolean; posting?: JobPosting; error?: string }> {
    try {
        const record = await db.jobPosting.findUnique({ where: { id } });
        if (!record) {
            return { success: false, error: 'Job posting not found.' };
        }

        const posting: JobPosting = {
            id: record.id,
            title: record.title,
            location: record.location ?? undefined,
            type: (record.type as JobPosting['type']) ?? undefined,
            description: record.description ?? undefined,
            status: record.status as JobPosting['status'],
            qualifications: (record.qualifications as any) ?? [],
            salary: record.salary ?? undefined,
            openings: record.openings ?? undefined,
            createdAt: record.createdAt ? record.createdAt.toISOString() : null,
            updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
        };
        return { success: true, posting };

    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get job posting ${id}: ${e.message}`, stack: e.stack, source: 'getJobPostingById' });
        return { success: false, error: 'Failed to fetch job posting.' };
    }
}

export async function updateJobPosting(id: string, data: Partial<Omit<JobPosting, 'id'>>): Promise<{ success: boolean; error?: string }> {
    try {
        await db.jobPosting.update({
          where: { id },
          data: {
            ...(typeof data.title === 'string' ? { title: data.title } : {}),
            ...(data.location !== undefined ? { location: data.location ?? null } : {}),
            ...(data.type !== undefined ? { type: data.type ?? null } : {}),
            ...(data.description !== undefined ? { description: data.description ?? null } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.qualifications !== undefined ? { qualifications: (data.qualifications as any) ?? null } : {}),
            ...(data.salary !== undefined ? { salary: data.salary ?? null } : {}),
            ...(data.openings !== undefined ? { openings: data.openings ?? null } : {}),
            updatedAt: new Date(),
          },
        });
        revalidatePath(`/manage/hiring`);
        revalidatePath(`/manage/hiring/${id}`);
        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to update job posting ${id}: ${e.message}`, stack: e.stack, source: 'updateJobPosting' });
        return { success: false, error: 'Failed to update job posting.' };
    }
}

export async function deleteJobPosting(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.jobPosting.delete({ where: { id } });
        revalidatePath('/manage/hiring');
        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to delete job posting ${id}: ${e.message}`, stack: e.stack, source: 'deleteJobPosting' });
        return { success: false, error: 'Failed to delete job posting.' };
    }
}
