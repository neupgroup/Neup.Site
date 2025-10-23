
import { getTeams } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export default async function TeamsPage() {
    const { teams, error } = await getTeams();

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Teams</h1>
                <Button asChild>
                    <Link href="/manage/team/create">
                        <Plus className="mr-2" /> Create Team
                    </Link>
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Teams</CardTitle>
                    <CardDescription>
                        A list of all teams in your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!error && !teams?.length ? (
                         <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No teams created yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams?.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell>
                                            <Link href={`/manage/team/${team.id}`} className="font-medium hover:underline">
                                                {team.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{team.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
