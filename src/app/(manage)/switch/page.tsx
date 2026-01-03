
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesForAccount } from '@/actions/sites';
import { setSiteIdCookie } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/ProfileContext';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Building, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import type { Site } from '@/schemas/site';
import { usePageTitle } from '@/hooks/use-page-title';

function SiteList() {
    const [allSites, setAllSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);

    const { site: activeSite } = useProfile();
    const { toast } = useToast();

    useEffect(() => {
        const fetchSites = async () => {
            setLoading(true);
            const { sites, error } = await getSitesForAccount();
            if (error) {
                setError(error);
            } else {
                setAllSites(sites || []);
            }
            setLoading(false);
        };
        fetchSites();
    }, []);

    const handleSelectSite = async (siteId: string) => {
        setIsSwitching(siteId);
        const result = await setSiteIdCookie(siteId);
        if (result.success) {
            toast({ title: 'Site Switched', description: `You are now working on site: ${siteId}.` });
            window.location.href = '/';
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setIsSwitching(null);
        }
    };
    
    const otherSites = allSites.filter(site => site.id !== activeSite?.id);
    const currentSite = allSites.find(site => site.id === activeSite?.id);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="w-full space-y-6">
            {currentSite && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Current Site</h2>
                    <div className="p-3 bg-primary/10 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-2 border-primary">
                        <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">{currentSite.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{currentSite.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-green-600">
                           <CheckCircle className="h-5 w-5" />
                           <span className="font-semibold">Selected</span>
                        </div>
                    </div>
                </div>
            )}

            {otherSites.length > 0 && (
                <div>
                     <h2 className="text-lg font-semibold mb-2 mt-8">Available Sites</h2>
                     <div className="space-y-2">
                        {otherSites.map(site => (
                            <div key={site.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border">
                                <div className="flex items-center gap-3">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{site.name}</p>
                                        <p className="text-sm text-muted-foreground font-mono">{site.id}</p>
                                    </div>
                                </div>
                                <Button onClick={() => handleSelectSite(site.id)} size="sm" disabled={isSwitching === site.id}>
                                     {isSwitching === site.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                    )}
                                    Select
                                </Button>
                            </div>
                        ))}
                     </div>
                </div>
            )}
             {allSites.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No sites found for your account.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function SwitchPage() {
    usePageTitle('Switch Site');
    const { loading: profileLoading } = useProfile();
    
    return (
        <div className="w-full">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Switch Site</h1>
                <p className="text-muted-foreground">
                   Choose a site to continue working on.
                </p>
            </header>

            {profileLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <SiteList />
            )}
        </div>
    );
}
