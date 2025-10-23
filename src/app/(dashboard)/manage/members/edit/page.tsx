
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RepositionMembersPage() {
    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Reposition Members</h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Order Members</CardTitle>
                    <CardDescription>
                        Drag and drop to change the display order of team members.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <p>Member ordering functionality is coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
