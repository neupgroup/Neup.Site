
import { redirect } from 'next/navigation';
import { makeAppPath } from '#/core/appconfig';

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

  redirect(makeAppPath('/home'));
}
