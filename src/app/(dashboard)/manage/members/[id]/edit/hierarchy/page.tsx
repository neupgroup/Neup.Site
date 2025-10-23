
'use client';
import { useState, useEffect } from 'react';
import { getTeams, type Team } from '@/actions/teams';
import { getMember, updateMember, type Member } from '@/actions/members';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditMemberHierarchyPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { toast } = useToast();
    const [member, setMember] = useState<Member | null>(null);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [memberRes, teamsRes] = await Promise.all([
                getMember(id),
                getTeams()
            ]);

            if (memberRes.success && memberRes.member) {
                setMember(memberRes.member);
                setSelectedTeams(new Set(memberRes.member.teamIds || []));
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch member.' });
            }

            if (teamsRes.success && teamsRes.teams) {
                setAllTeams(teamsRes.teams);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch teams.' });
            }
            setLoading(false);
        }
        fetchData();
    }, [id, toast]);

    const handleTeamToggle = (teamId: string) => {
        const newSelection = new Set(selectedTeams);
        if (newSelection.has(teamId)) {
            newSelection.delete(teamId);
        } else {
            newSelection.add(teamId);
        }
        setSelectedTeams(newSelection);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateMember(id, { teamIds: Array.from(selectedTeams) });
        if (result.success) {
            toast({ title: 'Assignments Saved' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-2xl">
             <div className="mb-4">
                <Button variant="ghost" asChild>
                    <Link href={`/manage/members/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Member
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Assign Teams</CardTitle>
                    <CardDescription>
                        Manage team assignments for <span className="font-semibold">{member?.name}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {allTeams.map(team => (
                        <div key={team.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`team-${team.id}`}
                                checked={selectedTeams.has(team.id)}
                                onCheckedChange={() => handleTeamToggle(team.id)}
                            />
                            <Label htmlFor={`team-${team.id}`} className="cursor-pointer">
                                {team.name}
                            </Label>
                        </div>
                    ))}
                    {allTeams.length === 0 && <p className="text-muted-foreground text-sm">No teams have been created yet.</p>}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Save Assignments
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
