
import { ProfileProvider } from '@/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProfileProvider>
      <ProgressBar />
      <Dashboard>{children}</Dashboard>
    </ProfileProvider>
  );
}
