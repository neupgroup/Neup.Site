import { prisma as db } from '@neup/core/database/prisma';

export async function getProjectHiring(projectId: string) {
  const project = await db.asset.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return { success: false as const, error: 'Project not found.' };

  const postings = await db.jobPosting.findMany({
    where: { projectId, status: 'Open' },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });

  return { success: true as const, postings };
}

export async function getProjectHiringPosting(projectId: string, id: string) {
  const posting = await db.jobPosting.findFirst({ where: { projectId, id, status: 'Open' } });
  if (!posting) return { success: false as const, error: 'Job posting not found.' };
  return { success: true as const, posting };
}
