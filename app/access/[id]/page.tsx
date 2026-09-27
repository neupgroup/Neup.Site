import Link from 'next/link';
import { ArrowLeft, Shield, Users } from 'lucide-react';

import { Badge } from '@neup/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { getAccessOverview } from '@/services/access';
import { getActiveProjectId } from '@/services/projects';

type AccessUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccessUserPage({ params }: AccessUserPageProps) {
  const [{ id }, { sites }, activeProjectId] = await Promise.all([
    params,
    getAccessOverview(),
    getActiveProjectId(),
  ]);
  const accountId = decodeURIComponent(id);
  const selectedSite = sites?.find((site) => site.assetId === activeProjectId);
  const user = selectedSite?.users.find((item) => item.accountId === accountId);
  const backHref = activeProjectId ? `/access?project=${encodeURIComponent(activeProjectId)}` : '/access';

  return (
    <div className="w-full max-w-3xl space-y-8">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Access
      </Link>

      {!selectedSite || !user ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
          <Shield className="mx-auto mb-4 h-12 w-12" />
          <p className="font-medium text-foreground">Access record not found.</p>
          <p className="mt-1 text-sm">This user does not have access to the selected project.</p>
        </div>
      ) : (
        <>
          <header className="space-y-2">
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Management User</h1>
            <p className="text-sm text-muted-foreground">Access details for {selectedSite.assetName}.</p>
          </header>
          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>{user.neupId ?? (user.displayName || 'Management User')}</CardTitle>
              {user.neupId && user.displayName ? <CardDescription>{user.displayName}</CardDescription> : null}
              <CardDescription>{selectedSite.assetName} ({selectedSite.assetId})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => <Badge key={`${user.accountId}-${role}`} variant="outline">{role}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
