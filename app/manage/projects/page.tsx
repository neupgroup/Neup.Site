import Link from 'next/link';
import { ChevronRight, FolderKanban } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Badge } from '#/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';
import { getManagedProjectsOverview } from '@/services/projects';

/*
::neup.documentation::manage-projects-page

::public

Projects overview page for `/manage/projects`.

It lists the projects the current account manages and links into each
project's dedicated detail page.

::public end
::end
*/

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Projects',
  });
}
export default async function ManageProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const params = await searchParams;
  const selectedProject = params.selectedProject?.trim() || null;
  const { success, projects, error } = await getManagedProjectsOverview();
  const managedProjects = projects ?? [];
  const totalProjects = managedProjects.length;

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Review the projects you manage and open a project to see its users and dangerous actions.</p>
      </header>

      {!success ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? 'Failed to load projects.'}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Managed projects</CardDescription>
              <CardTitle className="mt-2 text-3xl">{totalProjects}</CardTitle>
            </div>
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </section>

      {!success || !managedProjects.length ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <FolderKanban className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">No managed projects found.</p>
              <p className="mt-1 text-sm">Create a project or gain owner access to a project to populate this page.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-0">
          {managedProjects.map((project, index) => {
            const isFirst = index === 0;
            const isLast = index === managedProjects.length - 1;

            return (
              <Link
                key={project.id}
                href={appendSelectedProject(`/manage/projects/${project.id}`, selectedProject)}
                className={[
                  'block w-full border p-4 transition-colors hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isFirst ? 'rounded-t-md' : 'rounded-t-none',
                  isLast ? 'rounded-b-md' : 'rounded-b-none',
                  !isLast ? 'border-b-0' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      <FolderKanban className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">{project.name}</h2>
                        {project.isCurrentProject ? <Badge variant="secondary">Current Project</Badge> : null}
                        {project.status ? <Badge variant="outline">{project.status}</Badge> : null}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
