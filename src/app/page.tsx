
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold font-headline mb-8">Welcome to Neup.Sites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View and manage all of your saved sites.
            </p>
            <Button asChild>
              <Link href="/site/pages">View My Sites <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Site Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visually build and manage your website pages.
            </p>
            <Button asChild>
              <Link href="/site/editor">Go to Editor <ArrowRight className="ml-2" /></Link>
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
            <CardTitle>Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View application and server-side errors.
            </p>
            <Button asChild>
              <Link href="/errors">View Errors <ArrowRight className="ml-2" /></Link>
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
}
