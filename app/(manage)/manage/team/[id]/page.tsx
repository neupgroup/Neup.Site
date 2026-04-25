
import { getTeam } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: { id: string }}) {
    const { team } = await getTeam(params.id);
    return await generatePageMetadata(team ? `Team: ${team.name}` : 'Team');
}

export default async function ViewTeamPage({ params }: { params: { id: string } }) {
    const { team, error } = await getTeam(params.id);

    if (error || !team) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || 'Team not found'}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="w-full max-w-2xl">
            <div className="mb-4">
                <Button variant="outline" asChild>
                    <Link href="/manage/team">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Teams
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Display Order: {team.order}</p>
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
