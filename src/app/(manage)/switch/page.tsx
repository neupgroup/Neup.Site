
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesForAccount } from '@/actions/sites';
import { setSiteIdCookie } from '@/actions/auth';
import { logout } from '@/actions/auth/logout';
import { useToast } from '@/hooks/use-toast';
import { getCookie } from '@/lib/session-manager';
import { useProfile } from '@/context/ProfileContext';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogOut, Building, Loader2, ArrowRight, Replace } from 'lucide-react';
import type { Site } from '@/schemas/site';

function SiteList({ onSelectSite }: { onSelectSite: (siteId: string) => void }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      const { sites, error } = await getSitesForAccount();
      if (error) {
        setError(error);
      } else {
        setSites(sites || []);
      }
      setLoading(false);
    };
    fetchSites();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
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
    <div className="w-full space-y-4">
       <h2 className="text-xl font-semibold">Select a Site</h2>
       <p className="text-muted-foreground">Choose a site from your account to continue.</p>
      {sites.length > 0 ? (
        sites.map(site => (
          <div key={site.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border">
            <div className="flex items-center gap-3">
                 <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-semibold">{site.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{site.id}</p>
                </div>
            </div>
            <Button onClick={() => onSelectSite(site.id)} size="sm">
                Select <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))
      ) : (
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
    const { site, loading: profileLoading } = useProfile();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleSelectSite = async (siteId: string) => {
        const result = await setSiteIdCookie(siteId);
        if (result.success) {
            toast({ title: 'Site Switched', description: `You are now working on site: ${siteId}.` });
            // Instead of router.push, we reload the page to ensure all contexts are updated.
            window.location.href = '/';
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        window.location.reload();
    }
    
    if (profileLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Switch Site</h1>
                <p className="text-muted-foreground">
                   {site ? 'Switch to a different site or log out.' : 'Choose a site to continue.'}
                </p>
            </header>

            {site ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>Current Site</CardTitle>
                        <CardDescription>You are currently managing the site below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-3 bg-muted rounded-md flex items-center gap-3">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{site.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{site.id}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Replace className="mr-2 h-4 w-4"/>}
                            {isLoggingOut ? 'Switching...' : 'Switch Site'}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <SiteList onSelectSite={handleSelectSite} />
            )}
        </div>
    );
}
