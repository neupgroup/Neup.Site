
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const params = await searchParams;
  const selectedProject = params.selectedProject?.trim();

  if (selectedProject) {
    redirect(`/home?selectedProject=${encodeURIComponent(selectedProject)}`);
  }

  redirect('/home');
}
