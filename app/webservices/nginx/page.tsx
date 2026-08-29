'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import {
    Plus,
    RotateCw,
    FileText,
    Settings,
    Globe,
    Shield,
    Loader2
} from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { Badge } from '#/components/ui/badge';

export default function NginxPage() {
    usePageTitle('Nginx', 'NeupSites');
    const [isCreating, setIsCreating] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);

    const handleCreate = async () => {
        setIsCreating(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsCreating(false);
    };

    const handleRestart = async () => {
        setIsRestarting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsRestarting(false);
    };

    return (
        <div className="w-full">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Nginx</h1>
                    <Badge variant="outline" className="text-xs">Web Server</Badge>
                </div>
                <p className="text-muted-foreground">
                    Manage your Nginx web server configuration and services.
                </p>
            </header>

            {/* First Card Set: Create and Restart */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Card */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Plus className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Create Configuration</CardTitle>
                                        <CardDescription className="mt-1">
                                            Generate a new Nginx server block
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create a new Nginx configuration file for your domain with SSL support,
                                proxy settings, and optimized caching rules.
                            </p>
                            <Button type="solid"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create New Config
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Restart Card */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <RotateCw className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <CardTitle>Restart Service</CardTitle>
                                        <CardDescription className="mt-1">
                                            Reload Nginx to apply changes
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Gracefully restart the Nginx service to apply configuration changes
                                without dropping active connections.
                            </p>
                            <Button
                                onClick={handleRestart}
                                disabled={isRestarting}
                                type="tinted"
                                className="w-full"
                            >
                                {isRestarting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Restarting...
                                    </>
                                ) : (
                                    <>
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        Restart Nginx
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Second Card Set: Default and Other Options */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Configuration Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Default Configuration */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <CardTitle className="text-lg">Default Config</CardTitle>
                            </div>
                            <CardDescription>
                                View and edit the default Nginx configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                View Default
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Advanced Settings */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Settings className="h-5 w-5 text-purple-500" />
                                </div>
                                <CardTitle className="text-lg">Advanced Settings</CardTitle>
                            </div>
                            <CardDescription>
                                Configure advanced Nginx parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                Configure
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Virtual Hosts */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Globe className="h-5 w-5 text-green-500" />
                                </div>
                                <CardTitle className="text-lg">Virtual Hosts</CardTitle>
                            </div>
                            <CardDescription>
                                Manage server blocks and domains
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <Globe className="mr-2 h-4 w-4" />
                                Manage Hosts
                            </Button>
                        </CardContent>
                    </Card>

                    {/* SSL/TLS Settings */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                </div>
                                <CardTitle className="text-lg">SSL/TLS</CardTitle>
                            </div>
                            <CardDescription>
                                Configure SSL certificates and security
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <Shield className="mr-2 h-4 w-4" />
                                SSL Settings
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Performance Tuning */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Settings className="h-5 w-5 text-amber-500" />
                                </div>
                                <CardTitle className="text-lg">Performance</CardTitle>
                            </div>
                            <CardDescription>
                                Optimize caching and compression
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                Optimize
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Logs & Monitoring */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-red-500" />
                                </div>
                                <CardTitle className="text-lg">Logs</CardTitle>
                            </div>
                            <CardDescription>
                                View access and error logs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="outlined" className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                View Logs
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
