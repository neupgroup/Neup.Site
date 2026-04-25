
'use server';

import { cookies } from 'next/headers';
import { db } from '@/core/lib/db';
import type { Datalist } from '@/schemas/datalist';

/**
 * Creates a new datalist.
 */
export async function createDatalist(datalistData: Omit<Datalist, 'id' | 'createdAt' | 'updatedAt' | 'artifactId'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const now = new Date();
    const record = await db.datalist.create({
      data: {
        artifactId,
        name: datalistData.name,
        data: datalistData.data,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create datalist.' };
  }
}

/**
 * Fetches all datalists for the current site.
 */
export async function getDatalists(): Promise<{ success: boolean; datalists?: Datalist[]; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const records = await db.datalist.findMany({
      where: { artifactId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    const datalists = records.map((record) => ({
      id: record.id,
      artifactId: record.artifactId,
      name: record.name,
      data: record.data,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    })) as Datalist[];
    return { success: true, datalists };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch datalists.' };
  }
}

/**
 * Fetches a single datalist by its ID.
 */
export async function getDatalist(id: string): Promise<{ success: boolean; datalist?: Datalist; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.datalist.findUnique({ where: { id } });
    if (!record || record.artifactId !== artifactId) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }

    const datalist: Datalist = {
      id: record.id,
      artifactId: record.artifactId,
      name: record.name,
      data: record.data,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };
    return { success: true, datalist };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch datalist.' };
  }
}

/**
 * Updates a datalist.
 */
export async function updateDatalist(id: string, datalistData: Partial<Omit<Datalist, 'id' | 'artifactId' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const result = await db.datalist.updateMany({
      where: { id, artifactId },
      data: {
        ...(typeof datalistData.name === 'string' ? { name: datalistData.name } : {}),
        ...(typeof datalistData.data === 'string' ? { data: datalistData.data } : {}),
        updatedAt: new Date(),
      },
    });
    if (result.count === 0) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update datalist.' };
  }
}

/**
 * Deletes a datalist.
 */
export async function deleteDatalist(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const result = await db.datalist.deleteMany({ where: { id, artifactId } });
    if (result.count === 0) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to delete datalist.' };
  }
}
