
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const statusSections = [
    { title: 'Storage & Files', href: 'storage', description: 'View disk usage and browse files.' },
    { title: 'Network', href: 'network', description: 'See active ports and listening services.' },
    { title: 'Processes', href: 'processes', description: 'Browse system processes and PM2 apps.' },
];

export default function ServerStatusNavigation({ serverId }: { serverId: string }) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Server Status & Management</CardTitle>
            <CardDescription>Select a category to view detailed real-time information about the server.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusSections.map(section => (
                <Link key={section.href} href={`/root/servers/${serverId}/${section.href}`} className="block">
                    <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all h-full">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                </Link>
            ))}
        </CardContent>
    </Card>
  );
}
