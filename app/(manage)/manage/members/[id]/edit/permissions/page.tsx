
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditMemberPermissionsPage({ params }: { params: { id: string } }) {
    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Edit Member Permissions: {params.id}</h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Assign Permissions</CardTitle>
                    <CardDescription>
                        Manage permissions for this member.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <p>Permission management UI is coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
