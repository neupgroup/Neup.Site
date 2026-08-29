
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { use } from 'react';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function EditTeamHierarchyPage({ params }: { params: Promise<{ id: string }> }) {
    usePageTitle('Edit Team Hierarchy');
    const { id } = use(params);
    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Edit Team Hierarchy: {id}</h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Team Members</CardTitle>
                    <CardDescription>
                        Add or remove members from this team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <p>Team hierarchy management UI is coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
