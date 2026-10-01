'use server';

import { prisma as db } from '@neup/core/database/prisma';

export async function createReview(input: { projectId: string; reviewer: string; content?: string; rating: number; reply?: string }) {
  const reviewer = input.reviewer.trim();
  if (!input.projectId || !reviewer || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: 'Reviewer, project, and a rating from 1 to 5 are required.' };
  }
  try {
    const review = await db.review.create({
      data: { projectId: input.projectId, reviewer, content: input.content?.trim() || null, rating: input.rating, reply: input.reply?.trim() || null, repliedOn: input.reply?.trim() ? new Date() : null },
    });
    return { review };
  } catch (error) {
    console.error('createReview failed:', error);
    return { error: error instanceof Error ? error.message : 'Failed to add review.' };
  }
}

export async function deleteReview(input: { id: string; projectId: string }) {
  try {
    await db.review.deleteMany({ where: { id: input.id, projectId: input.projectId } });
    return { success: true };
  } catch (error) {
    console.error('deleteReview failed:', error);
    return { error: 'Failed to delete review.' };
  }
}
