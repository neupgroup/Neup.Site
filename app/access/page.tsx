import { ArrowRight, Plus, Users } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { Badge } from '@neup/components/ui/badge';
import { getAccessOverview } from '@/services/access';
import { getActiveProjectId } from '@/services/projects';

export default async function AccessPage() {
  const [{ success, sites, error }, activeProjectId] = await Promise.all([
    getAccessOverview(),
    getActiveProjectId(),
  ]);
  const selectedSite = sites?.find((site) => site.assetId === activeProjectId);
  const users = selectedSite?.users ?? [];
  const addHref = activeProjectId ? `/access/add?project=${encodeURIComponent(activeProjectId)}` : '/access/add';

  return (
    <div className="w-full max-w-none space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Access</h1>
        <p className="text-sm text-muted-foreground">Review the users who can access the selected site.</p>
      </header>

      {!success ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? 'Failed to load access information.'}</AlertDescription>
        </Alert>
      ) : !activeProjectId ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">Select a project to view its users.</div>
      ) : !selectedSite ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">This project was not found or you do not have access to it.</div>
      ) : (
        <div className="grid gap-4">
          <LinkButton
            variant="plain"
            className="grid h-auto justify-start gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr_auto] md:items-center"
            href={addHref}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </span>
            <span>
              <span className="block font-medium">Add Management User</span>
              <span className="block text-sm text-muted-foreground">Give an existing account access to this project.</span>
            </span>
            <ArrowRight className="h-4 w-4" />
          </LinkButton>

          {users.map((user) => (
            <LinkButton
              key={user.accountId}
              variant="plain"
              className="grid h-auto justify-start gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr_auto] md:items-center"
              href={`/access/${encodeURIComponent(user.accountId)}${activeProjectId ? `?project=${encodeURIComponent(activeProjectId)}` : ''}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{user.displayName || 'Management User'}</span>
                <span className="block text-sm text-muted-foreground">Management access</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {user.roles.map((role) => <Badge key={`${user.accountId}-${role}`} variant="outline">{role}</Badge>)}
              </span>
            </LinkButton>
          ))}

          {!users.length ? (
            <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">No users have access yet.</p>
              <p className="mt-1 text-sm">Add a management user to populate this list.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
