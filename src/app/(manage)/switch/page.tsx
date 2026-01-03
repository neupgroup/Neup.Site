
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesForAccount } from '@/actions/sites';
import { setSiteIdCookie } from '@/actions/auth';
import { logout } from '@/actions/auth/logout';
import { useToast } from '@/hooks/use-toast';
import { getCookie } from '@/lib/session-manager';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogOut, Building, Loader2, ArrowRight } from 'lucide-react';
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
      {sites.length > 0 ? (
        sites.map(site => (
          <Card key={site.id} className="hover:border-primary transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{site.name}</CardTitle>
                <CardDescription>ID: {site.id}</CardDescription>
              </div>
              <Button onClick={() => onSelectSite(site.id)}>
                Select <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
          </Card>
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


function LogoutHandler() {
    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            await logout();
            router.refresh();
        };
        handleLogout();
    }, [router]);

    return (
         <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Switching account...</p>
        </div>
    );
}

export default function SwitchPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const siteId = getCookie('siteId');
        setIsAuthenticated(!!siteId);
    }, []);

    const handleSelectSite = async (siteId: string) => {
        const result = await setSiteIdCookie(siteId);
        if (result.success) {
            toast({ title: 'Site Switched', description: `You are now working on site: ${siteId}.` });
            router.push('/');
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    if (isAuthenticated === null) {
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
                    {isAuthenticated ? 'You will be logged out to select a new site.' : 'Choose a site to continue.'}
                </p>
            </header>

            {isAuthenticated ? (
                <LogoutHandler />
            ) : (
                <SiteList onSelectSite={handleSelectSite} />
            )}
        </div>
    );
}
