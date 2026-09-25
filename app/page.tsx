
import { redirect } from 'next/navigation';
import { makeAppPath } from '@neup/core/appconfig';
import { prisma as db } from '@neup/core/database/prisma';
import { getAccountId } from '@/services/accounts';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const project = params.project?.trim();

  if (project) {
    redirect(makeAppPath(`/home?project=${encodeURIComponent(project)}`));
  }

  let defaultProject: string | null = null;

  try {
    const accountId = await getAccountId();
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { defaultProject: true },
    });

    defaultProject = account?.defaultProject?.trim() || null;
  } catch {
    // Unauthenticated visitors continue to the project switcher.
  }

  if (defaultProject) {
    redirect(makeAppPath(`/home?project=${encodeURIComponent(defaultProject)}`));
  }

  redirect(makeAppPath('@neup/switch'));
}
