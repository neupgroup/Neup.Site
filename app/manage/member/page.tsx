import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generatePageMetadata } from '@/core/helpers/metadata';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';
import { getMembers } from '@/services/members';
import { getTeams } from '@/services/teams';
import { MemberCards } from './member-cards';

/*
::neup.documentation::manage-member-page

::public

Landing page for member management with team-grouped member cards and action
buttons.

::public end
::end
*/

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Members',
  });
}

export default async function ManageMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const params = await searchParams;
  const selectedProject = params.selectedProject?.trim() || null;
  const [{ teams, error: teamsError }, { members, error: membersError }] = await Promise.all([
    getTeams(),
    getMembers(),
  ]);

  const error = teamsError ?? membersError;

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Add teams and members from their own dedicated pages.</p>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!members?.length && !teams?.length ? (
        <div className="grid gap-4">
          <Link
            href={appendSelectedProject('/manage/member/addMember', selectedProject)}
            className="grid gap-4 rounded-lg border border-dashed bg-card px-5 py-4 transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr] md:items-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">Add Member</div>
              <div className="text-sm text-muted-foreground">Create the first member for this team surface.</div>
            </div>
          </Link>
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12" />
            <p className="font-medium text-foreground">No employees found.</p>
            <p className="mt-1 text-sm">Create the first member to show employees here.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <Link
            href={appendSelectedProject('/manage/member/addMember', selectedProject)}
            className="grid gap-4 rounded-lg border border-dashed bg-card px-5 py-4 transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr] md:items-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">Add Member</div>
              <div className="text-sm text-muted-foreground">Create another member from the dedicated add form.</div>
            </div>
          </Link>
          <MemberCards initialTeams={teams ?? []} initialMembers={members ?? []} />
        </div>
      )}
    </div>
  );
}
