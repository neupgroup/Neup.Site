
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '#/core/hooks/useToast';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';

export default function LinkGitHubPage() {
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get('selectedProject');
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'GitHub Authentication Failed',
        description: decodeURIComponent(error),
      });
    }
  }, [searchParams, toast]);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Link GitHub Account</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Connect to GitHub</CardTitle>
          <CardDescription>
            Authorize Neup.Sites to access your GitHub account to read repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-12">
            <Github className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <Button type="solid" asChild>
              <Link href={appendSelectedProject('/bridge/api/v1/github/start', selectedProject)}>
                <Github className="mr-2 h-4 w-4" /> Connect with GitHub
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
