
import { getSiteServers } from '@/server/servers';
import { getArtifact } from '@/server/editor/artifact';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Server, Globe, Shield, Zap, Folder, HardDrive } from 'lucide-react';

import { SyncPortButton } from './sync-port-button';

export default async function DevSettingsPage() {
    const [serversData, siteData] = await Promise.all([
        getSiteServers(),
        getArtifact()
    ]);

    const servers = serversData.success ? serversData.servers || [] : [];
    const site = siteData.success ? siteData.site : null;

    if (!site) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold font-headline mb-4">Development Information</h1>
                <p className="text-muted-foreground">Could not retrieve site information.</p>
            </div>
        );
    }

    const productionDomain = site.domains?.production?.url;
    const isSslEnabled = site.domains?.production?.forceHttps || (productionDomain && productionDomain.startsWith('https'));

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold font-headline">Development Information</h1>
                <p className="text-muted-foreground mt-2">Technical details about your site's deployment and infrastructure.</p>
            </header>

            <div className="grid gap-6">
                {/* Artifact Overview Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Artifact Overview
                        </CardTitle>
                        <CardDescription>General information about your production site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Production Domain</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                                        {productionDomain || 'Not configured'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">SSL Status</span>
                                <div className="flex items-center gap-2">
                                    {isSslEnabled ? (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <XCircle className="h-3 w-3 mr-1" /> Disabled
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Framework</span>
                                <div className="font-medium">Next.js</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Powered By</span>
                                <div className="flex items-center gap-1 font-semibold text-primary">
                                    <Zap className="h-4 w-4" /> neup.sites
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Infrastructure Card */}
                {servers.length > 0 ? (
                    servers.map((server) => {
                        const appLocation = server.appPath
                            ? server.appPath.replace(/\{\{\s*universal\.site_id\s*\}\}/g, site.id)
                            : `/var/www/${site.id}`;

                        return (
                            <Card key={server.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="h-5 w-5 text-primary" />
                                        Infrastructure: {server.name}
                                    </CardTitle>
                                    <CardDescription>Details about the server hosting this application.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-muted-foreground">Public IP Address</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-lg">{server.publicIp}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-muted-foreground">Port Allocation</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">
                                                    Port: {server.allocation.port}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground mr-2">(Internal Traffic)</span>
                                                <SyncPortButton artifactId={site.id} serverId={server.id} />
                                            </div>
                                        </div>

                                        <div className="space-y-1 md:col-span-2">
                                            <span className="text-sm font-medium text-muted-foreground">Application Path</span>
                                            <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                                <Folder className="h-4 w-4 text-muted-foreground" />
                                                <code className="text-sm flex-1">{appLocation}</code>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-muted-foreground">Server Provider</span>
                                            <div>{server.provider || 'Custom / Unknown'}</div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-muted-foreground">Platform</span>
                                            <div className="capitalize">{server.platform || 'Linux'}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                <HardDrive className="h-5 w-5" />
                                No Infrastructure Allocated
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">This site is not currently linked to any server infrastructure.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
