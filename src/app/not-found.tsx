
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                <SearchX className="h-12 w-12 text-destructive" />
            </div>
          <CardTitle className="text-5xl font-bold font-headline text-destructive">404 - Page Not Found</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Sorry, the page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
