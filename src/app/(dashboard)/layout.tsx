
import { ProfileProvider } from '@/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { getSite } from '@/actions/editor/site';
import { cn } from '@/lib/utils';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site } = await getSite();

  return (
    <ProfileProvider>
        <Dashboard theme={site?.theme}>{children}</Dashboard>
    </ProfileProvider>
  );
}
