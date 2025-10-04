
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSite } from '@/actions/editor/site';
import { Dashboard } from '@/components/dashboard';

export default async function DashboardPage() {
  const { site } = await getSite();

  const pageContent = (
     <div className="p-8">
      <h1 className="text-3xl font-bold font-headline mb-8">Welcome to Neup.Sites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View and manage all of your saved pages.
            </p>
            <Button asChild>
              <Link href="/site/pages">View Pages <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visually build and manage your website pages.
            </p>
            <Button asChild>
              <Link href="/site/editor/dragger">Go to Editor <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage reusable page and section templates.
            </p>
            <Button asChild>
              <Link href="/root/templates">Manage Templates <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View application and server-side errors.
            </p>
            <Button asChild>
              <Link href="/root/errors">View Errors <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Landing Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Preview the public-facing landing page.
            </p>
            <Button asChild>
              <Link href="/landing">View Landing Page <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Since this is the default page for the dashboard, we re-wrap it with the Dashboard
  // component and pass the site theme, just like the layout used to.
  // Other site-specific pages would need a similar pattern if they were at the root of /(dashboard).
  return (
    <Dashboard theme={site?.theme}>{pageContent}</Dashboard>
  )
}
