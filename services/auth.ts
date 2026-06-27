
'use server'

import { cookies } from 'next/headers'
import { db } from '@/core/lib/db';

export async function setAssetIdCookie(assetId: string) {
  if (!assetId) {
    throw new Error('Asset ID cannot be empty.');
  }

  try {
    const existing = await db.asset.findUnique({ where: { id: assetId }, select: { id: true } });
    if (!existing) {
      await db.asset.create({
        data: {
          id: assetId,
          name: assetId,
          status: 'active',
          type: 'corporate portfolio',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Set the cookie after ensuring the asset document exists
    (await cookies()).set('assetId', assetId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });

    return { success: true };

  } catch (error: any) {
    console.error(`Failed to check or create asset for assetId "${assetId}":`, error);
    // In a real app, you might want to log this error
    return { success: false, error: 'Could not set up the asset. Please try again.' };
  }
}
