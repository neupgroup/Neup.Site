
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Users, FileText, Puzzle, Palette, Newspaper, Plus } from 'lucide-react';
import { generatePageMetadata } from '@/core/lib/metadata';

export async function generateMetadata() {
  return await generatePageMetadata('Home');
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


export default async function DashboardPage() {

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
          title="Total Pages"
          value={dashboardData.totalPages}
          icon={FileText}
          description="Live and draft pages"
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
              Create, edit, and manage your site's pages and news articles.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/site/pages/create">
                <Plus className="mr-2" /> New Page
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/news">
                <Newspaper className="mr-2" /> View News
              </Link>
            </Button>
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
            <Button asChild>
              <Link href="/site/theme">
                <Palette className="mr-2" />
                Edit Theme
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
