
'use client';

import { useState, useEffect } from 'react';
import { Separator } from '@neup/components/ui/separator';
import { getSiteModules, type SiteModules } from '@/services/modules';
import { getAsset } from '@/services/editor/asset';
import { Input } from '@neup/components/ui/input';
import { Badge } from '@neup/components/ui/badge';
import { Skeleton } from '@neup/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import Link from 'next/link';
import allPossibleModules from '@/services/site/modules/list.json';

export default function SiteModulesPage() {
  usePageTitle('Modules');
  const [modules, setModules] = useState<SiteModules>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchModules = async () => {
        setLoading(true);
        const [result, assetResult] = await Promise.all([getSiteModules(), getAsset()]);
        setSiteName(assetResult.asset?.name || null);
        if (result.success) {
            setModules(result.modules || {});
        } else {
            setError(result.error || 'Failed to fetch modules.');
        }
        setLoading(false);
    };
    fetchModules();
  }, []);

  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      )
  }

  const filteredModules = allPossibleModules.filter((moduleDef) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${moduleDef.name} ${moduleDef.id} ${moduleDef.description}`.toLowerCase().includes(query);
  });
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable modules to add or remove functionality from your site{siteName ? ` (${siteName})` : ''}.
          </p>
        </div>
      </header>
      <div>
        <div>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
           <Input
             value={search}
             onChange={(event) => setSearch(event.target.value)}
             placeholder="Search modules..."
             className="mb-4"
           />
           <div className="overflow-hidden rounded-md border">
                {filteredModules.map((moduleDef, index) => (
                    <div key={moduleDef.id}>
                        <Link
                          href={`/modules/${moduleDef.id}${window.location.search}`}
                          className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
                        >
                            <div className="flex-1 pr-4">
                                <div className="text-base font-medium">
                                    {moduleDef.name}
                                </div>
                                <p className="text-sm text-muted-foreground">{moduleDef.description}</p>
                            </div>
                            {modules[moduleDef.id]?.active ? <Badge variant="secondary">Enabled</Badge> : null}
                        </Link>
                        {index < filteredModules.length - 1 && <Separator />}
                   </div>
                ))}
                {!filteredModules.length ? <p className="p-6 text-sm text-muted-foreground">No modules found.</p> : null}
           </div>
        </div>
      </div>
    </div>
  );
}
