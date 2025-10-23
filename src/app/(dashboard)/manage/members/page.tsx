
import { getMembers } from '@/actions/members';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default async function MembersPage() {
    const { members, error } = await getMembers();

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Team Members</h1>
                 <Button asChild>
                    <Link href="/manage/members/add">
                        <Plus className="mr-2" /> Add Member
                    </Link>
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Members</CardTitle>
                    <CardDescription>
                        A list of all members in your organization.
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
                    {!error && !members?.length ? (
                         <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="font-semibold">No members found.</p>
                            <p className="text-sm">Click "Add Member" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members?.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                 <Avatar>
                                                    {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
                                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell className="capitalize">{member.role}</TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild variant="ghost" size="icon">
                                                <Link href={`/manage/members/${member.id}`}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
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
