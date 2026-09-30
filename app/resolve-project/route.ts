import { NextResponse } from 'next/server';
import { prisma as db } from '@neup/core/database/prisma';
import { getAccountId } from '@/services/accounts';
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get('returnTo');
  const destination = returnTo ? new URL(returnTo, request.url) : new URL(request.url);
  const accountId = await getAccountId();

  if (!accountId) {
    return NextResponse.redirect(new URL('/switch', request.url));
  }

  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { lastProject: true },
  });
  const lastProject = account?.lastProject?.trim();

  if (!lastProject) {
    return NextResponse.redirect(new URL('/switch', request.url));
  }

  destination.searchParams.set('project', lastProject);
  return NextResponse.redirect(destination);
}
