
import { getMember } from '@/actions/members';
import { getTeam } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default async function ViewMemberPage({ params }: { params: { id: string } }) {
    const { member, error } = await getMember(params.id);

    if (error || !member) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || 'Member not found'}</AlertDescription>
            </Alert>
        );
    }

    const teamPromises = member.teamIds?.map(teamId => getTeam(teamId)) || [];
    const teamResults = await Promise.all(teamPromises);
    const teams = teamResults.filter(r => r.success && r.team).map(r => r.team);
    
    return (
        <div className="w-full max-w-2xl">
            <div className="mb-4">
                <Button variant="outline" asChild>
                    <Link href="/manage/members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="text-center items-center">
                    <Avatar className="h-24 w-24 mb-4">
                        {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
                        <AvatarFallback className="text-3xl">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl">{member.name}</CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                    <Badge variant="secondary" className="mt-2">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2">Teams</h3>
                    <div className="flex flex-wrap gap-2">
                        {teams.length > 0 ? (
                            teams.map(team => team && (
                                <Badge key={team.id} variant="outline">{team.name}</Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Not a member of any teams.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                     <Button asChild>
                        <Link href={`/manage/members/${params.id}/edit/basics`}>
                            <Pencil className="mr-2" /> Edit Member
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
