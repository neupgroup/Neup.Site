import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';
import { getManagedProject } from '@/services/projects';
import { ProjectDeleteButton } from '../project-delete-button';

/*
::neup.documentation::manage-project-detail-page

::public

Project detail page for `/manage/projects/[id]`.

It shows the associated users for a managed project and is the only place in
this management surface that exposes the project deletion action.

::public end
::end
*/

function getInitials(name: string, fallback: string) {
  const source = name.trim() || fallback.trim() || 'P';

  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'P'
  );
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown';

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project } = await getManagedProject(id);

  return generatePageMetadata({
    title: project?.name || 'Project',
    prefix: 'Project',
    titleKind: 'prefix-title',
    prefixSeparator: ': ',
  });
}

export default async function ManageProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const selectedProject = rawSearchParams.selectedProject?.trim() || null;
  const { success, project } = await getManagedProject(id);

  if (!success || !project) {
    notFound();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <Button type="outlined" asChild>
          <Link href={appendSelectedProject('/manage/projects', selectedProject)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-headline text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.isCurrentProject ? <Badge variant="secondary">Current Project</Badge> : null}
          <Badge variant="outline">{project.totalUsers} users</Badge>
          {project.status ? <Badge variant="outline">{project.status}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{project.id}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Created {formatDate(project.createdAt)}</span>
          <span>Type: {project.type?.trim() || 'Unknown'}</span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Associated Users</CardTitle>
          <CardDescription>All user accounts currently associated with this project.</CardDescription>
        </CardHeader>
        <CardContent>
          {project.users.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {project.users.map((user) => (
                <div key={`${project.id}-${user.accountId}`} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 rounded-xl">
                      {user.displayImage ? <AvatarImage src={user.displayImage} alt={user.displayName || user.accountId} /> : null}
                      <AvatarFallback>{getInitials(user.displayName, user.accountId)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="space-y-1">
                        <p className="truncate font-medium">{user.displayName.trim() || user.accountId}</p>
                        <p className="truncate text-sm text-muted-foreground">{user.neupId?.trim() || user.accountId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <Badge key={`${project.id}-${user.accountId}-${role}`} variant={role === 'owner' ? 'secondary' : 'outline'}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No users are currently associated with this project.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/25">
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Delete this project only if it should be permanently removed along with its related records.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectDeleteButton
            projectId={project.id}
            projectName={project.name}
            isCurrentProject={project.isCurrentProject}
          />
        </CardContent>
      </Card>
    </div>
  );
}
