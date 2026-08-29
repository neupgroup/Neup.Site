
import { getTeam } from '@/services/teams';
import { getMembers } from '@/services/members';
import { Button } from '#/components/ui/buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { notFound } from 'next/navigation';

/*
::neup.documentation::manage-team-detail-page

::public

Team detail page for `/manage/team/[id]`.

It returns a 404 when the team does not exist and shows the members currently
assigned to the team, with the main management landing page under
`/manage/member`.

::public end
::end
*/

export async function generateMetadata({ params }: { params: { id: string }}) {
    const { team } = await getTeam(params.id);
    return generatePageMetadata({
        title: team?.name || 'Team',
        prefix: 'Team',
        titleKind: 'prefix-title',
        prefixSeparator: ': ',
    });
}

export default async function ViewTeamPage({ params }: { params: { id: string } }) {
    const [{ team, error }, { members }] = await Promise.all([
        getTeam(params.id),
        getMembers(),
    ]);

    if (error || !team) {
        notFound();
    }

    const assignedMembers = (members ?? []).filter((member) => member.teamId === team.id);
    
    return (
        <div className="w-full max-w-2xl">
            <div className="mb-4">
                <Button variant="tertiary" asChild>
                    <Link href="/manage/member">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-sm font-medium">Members</h2>
                        {assignedMembers.length ? (
                            <div className="space-y-2">
                                {assignedMembers.map((member) => (
                                    <div key={member.id} className="rounded-md border px-3 py-2 text-sm">
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-muted-foreground">{member.email} · {member.role}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No members are assigned to this team yet.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <Button asChild>
                        <Link href={`/manage/team/${params.id}/edit`}>
                            <Pencil className="mr-2" /> Edit Team
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
