
import { redirect } from 'next/navigation';
import { makeAppPath } from '#/core/appconfig';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const params = await searchParams;
  const selectedProject = params.selectedProject?.trim();

  if (selectedProject) {
    redirect(makeAppPath(`/home?selectedProject=${encodeURIComponent(selectedProject)}`));
  }

  redirect(makeAppPath('/home'));
}
