
'use server';

import { prisma as db } from '@neup/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { logger } from '@neup/logica/logger';
import { getActiveProjectId } from '@/services/projects';
import { slugify } from '@neup/core/helpers/slug';
import { parseCareerReference } from '@/services/career-reference';

function normalizeCareerSlug(value: string) {
  return slugify(value, 'career').replace(/-{2,}/g, '-').toLowerCase();
}

export interface JobPosting {
  id: string;
  slug: string;
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

export async function createJobPosting(data: Partial<Omit<JobPosting, 'id' | 'status'>>): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    const projectId = (await getActiveProjectId({ required: true }))!;
    const now = new Date();
    const slug = normalizeCareerSlug(data.slug ?? data.title ?? '');
    const record = await db.jobPosting.create({
      data: {
        title: data.title ?? '',
        projectId,
        slug,
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
    revalidatePath('@neup/careers');
    return { success: true, id: record.id, slug };
  } catch (e: any) {
    await logger.error({ message: `Failed to create job posting: ${e.message}`, stack: e.stack, source: 'createJobPosting' });
    return { success: false, error: 'Failed to create job posting.' };
  }
}

export async function getJobPostings(): Promise<{ success: boolean; postings?: JobPosting[]; error?: string }> {
  try {
    const projectId = (await getActiveProjectId({ required: true }))!;
    const records = await db.jobPosting.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const postings = records.map((record) => ({
      id: record.id,
      slug: record.slug,
      title: record.title,
      location: record.location ?? undefined,
      type: (record.type as JobPosting['type']) ?? undefined,
      description: record.description ?? undefined,
      status: record.status as JobPosting['status'],
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    })) as JobPosting[];
    return { success: true, postings };
  } catch (e: any) {
    await logger.error({ message: `Failed to get job postings: ${e.message}`, stack: e.stack, source: 'getJobPostings' });
    return { success: false, error: 'Failed to fetch job postings.' };
  }
}

export async function getJobPostingById(reference: string): Promise<{ success: boolean; posting?: JobPosting; error?: string }> {
    try {
        const projectId = (await getActiveProjectId({ required: true }))!;
        const parsed = parseCareerReference(reference);
        if (!parsed) return { success: false, error: 'Career reference is invalid.' };
        const record = await db.jobPosting.findFirst({ where: { id: parsed.id, slug: parsed.slug, projectId } });
        if (!record) {
            return { success: false, error: 'Job posting not found.' };
        }

        const posting: JobPosting = {
            id: record.id,
            slug: record.slug,
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
        await logger.error({ message: `Failed to get job posting ${reference}: ${e.message}`, stack: e.stack, source: 'getJobPostingById' });
        return { success: false, error: 'Failed to fetch job posting.' };
    }
}

export async function updateJobPosting(id: string, data: Partial<Omit<JobPosting, 'id'>>): Promise<{ success: boolean; error?: string }> {
    try {
        const projectId = (await getActiveProjectId({ required: true }))!;
        await db.jobPosting.update({
          where: { id, projectId },
          data: {
            ...(typeof data.title === 'string' ? { title: data.title } : {}),
            ...(typeof data.slug === 'string' ? { slug: normalizeCareerSlug(data.slug) } : {}),
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
        revalidatePath(`/careers`);
        revalidatePath(`/careers/${id}`);
        return { success: true };
    } catch (e: any) {
        await logger.error({ message: `Failed to update job posting ${id}: ${e.message}`, stack: e.stack, source: 'updateJobPosting' });
        return { success: false, error: 'Failed to update job posting.' };
    }
}

export async function deleteJobPosting(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const projectId = (await getActiveProjectId({ required: true }))!;
        await db.jobPosting.delete({ where: { id, projectId } });
        revalidatePath('@neup/careers');
        return { success: true };
    } catch (e: any) {
        await logger.error({ message: `Failed to delete job posting ${id}: ${e.message}`, stack: e.stack, source: 'deleteJobPosting' });
        return { success: false, error: 'Failed to delete job posting.' };
    }
}
