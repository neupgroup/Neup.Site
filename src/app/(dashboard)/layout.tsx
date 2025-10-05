
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
  const radiusClass = site?.theme?.radius ? `radius-${site.theme.radius}` : 'radius-medium';

  return (
    <ProfileProvider>
      <body className={cn("font-body antialiased", radiusClass)}>
        <ProgressBar />
        <Dashboard theme={site?.theme}>{children}</Dashboard>
      </body>
    </ProfileProvider>
  );
}
