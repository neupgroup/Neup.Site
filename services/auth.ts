
'use server'

import { cookies } from 'next/headers'
import { db } from '@/core/lib/db';

export async function setArtifactIdCookie(artifactId: string) {
  if (!artifactId) {
    throw new Error('Artifact ID cannot be empty.');
  }

  try {
    const existing = await db.artifact.findUnique({ where: { id: artifactId }, select: { id: true } });
    if (!existing) {
      await db.artifact.create({
        data: {
          id: artifactId,
          name: artifactId,
          status: 'active',
          type: 'corporate portfolio',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Set the cookie after ensuring the artifact document exists
    (await cookies()).set('artifactId', artifactId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });

    return { success: true };

  } catch (error: any) {
    console.error(`Failed to check or create artifact for artifactId "${artifactId}":`, error);
    // In a real app, you might want to log this error
    return { success: false, error: 'Could not set up the artifact. Please try again.' };
  }
}
