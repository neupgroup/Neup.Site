
import { ProfileProvider } from '@/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { getSite } from '@/actions/editor/site';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site } = await getSite();

  return (
    <ProfileProvider>
      <ProgressBar />
      <Dashboard theme={site?.theme}>{children}</Dashboard>
    </ProfileProvider>
  );
}
