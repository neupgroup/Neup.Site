import { getMembers } from '@/services/members';
import { getTeams } from '@/services/teams';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Button } from '#/components/ui/buttons';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { AlertCircle, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { TeamBoard } from './team-board';

/*
::neup.documentation::manage-team-list-page

::public

Landing page for `/manage/team`.

It organizes teams and their members with drag-and-drop ordering.

::public end
::end
*/

export async function generateMetadata() {
    return generatePageMetadata({
        title: 'Teams',
    });
}

export default async function TeamsPage() {
    const [{ teams, error: teamsError }, { members, error: membersError }] = await Promise.all([
        getTeams(),
        getMembers(),
    ]);
    const error = teamsError ?? membersError;

    return (
        <div className="w-full space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="font-headline text-2xl font-semibold tracking-tight">Team Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Drag teams to reorder them, or drag members between teams.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button asChild variant="tertiary">
                        <Link href="/manage/member/addTeam">
                            <Users className="mr-2 h-4 w-4" />
                            Create Group
                        </Link>
                    </Button>
                    <Button variant="primary" asChild>
                        <Link href="/manage/member/addMember">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Link>
                    </Button>
                </div>
            </header>
            {error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <TeamBoard teams={teams ?? []} members={members ?? []} />
            )}
        </div>
    );
}
