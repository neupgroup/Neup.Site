import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import Link from 'next/link';
import { Users, FileText, Puzzle, Palette, Newspaper } from 'lucide-react';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Home',
  });
}

// Placeholder data - in a real app, this would come from an API or database
const dashboardData = {
  todaysVisits: 1482,
  totalPages: 12,
  activeModules: 5,
};

const QuickStatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const params = await searchParams;
  const selectedProject = params.selectedProject?.trim() || null;

  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Here's a quick overview of your site.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <QuickStatCard
          title="Today's Visits"
          value={dashboardData.todaysVisits.toLocaleString()}
          icon={Users}
          description="+20.1% from last month"
        />
        <QuickStatCard
          title="Content Entries"
          value={dashboardData.totalPages}
          icon={FileText}
          description="Tracked site content"
        />
        <QuickStatCard
          title="Active Modules"
          value={dashboardData.activeModules}
          icon={Puzzle}
          description="Enabled site features"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Content</CardTitle>
            <CardDescription>
              Manage your published content and editorial workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <LinkButton className="w-full sm:w-auto" href={appendSelectedProject('/news/create', selectedProject)}>
                <Newspaper className="mr-2" /> New Article
              </LinkButton>
            <LinkButton variant="tinted" className="w-full sm:w-auto" href={appendSelectedProject('/news', selectedProject)}>
                <Newspaper className="mr-2" /> View News
              </LinkButton>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customize Appearance</CardTitle>
            <CardDescription>
              Change your site's colors, fonts, and overall theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href={appendSelectedProject('/site/theme', selectedProject)}>
                <Palette className="mr-2" />
                Edit Theme
              </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
