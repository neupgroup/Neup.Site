
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { getSiteModules, updateSiteModule, type SiteModules } from '@/services/modules';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

const allPossibleModules = [
    { id: 'user', name: 'User Module', description: 'Manages user authentication and profiles.' },
    { id: 'neupid', name: 'NeupID Module', description: 'Integrates with NeupID for single sign-on.' },
    { id: 'analytics', name: 'Analytics Module', description: 'Tracks user engagement and site metrics.' },
    { id: 'ad', name: 'Ad Module', description: 'Manages and displays advertisements.' },
    { id: 'social', name: 'Social Module', description: 'Handles social sharing and feeds.' },
    { id: 'meta-pixel', name: 'Meta Pixel Module', description: 'Integrates with Meta Pixel for tracking.' },
    { id: 'news', name: 'News Module', description: 'Adds a news/articles section to your site.' },
    { id: 'blog', name: 'Blog Module', description: 'Adds a blog section to your site.' },
    { id: 'database', name: 'Database Integration', description: 'Connects to a database for dynamic content.' },
    { id: 'google-analytics', name: 'Google Analytics Integration', description: 'Integrates with Google Analytics for detailed tracking.' },
    { id: 'payment', name: 'Payment Processing Module', description: 'Handles payments and subscriptions.' },
];

export default function SiteModulesPage() {
  usePageTitle('Artifact Modules');
  const [modules, setModules] = useState<SiteModules>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchModules = async () => {
        setLoading(true);
        const result = await getSiteModules();
        if (result.success && result.modules) {
            setModules(result.modules);
        } else {
            setError(result.error || 'Failed to fetch modules.');
        }
        setLoading(false);
    };
    fetchModules();
  }, []);

  const handleToggle = async (moduleId: string, checked: boolean) => {
    // Optimistic update
    setModules(prevModules => ({
        ...prevModules,
        [moduleId]: {
            ...prevModules[moduleId],
            active: checked
        }
    }));

    const result = await updateSiteModule(moduleId, checked);

    if (!result.success) {
        toast({
            variant: 'destructive',
            title: 'Error updating module',
            description: result.error,
        });
        // Revert optimistic update on failure
        setModules(prevModules => ({
            ...prevModules,
            [moduleId]: {
                ...prevModules[moduleId],
                active: !checked
            }
        }));
    } else {
         toast({
            title: 'Module Updated',
            description: `The ${moduleId} module has been ${checked ? 'enabled' : 'disabled'}.`,
        });
    }
  };

  if (loading) {
      return (
          <Card>
              <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
              <CardContent className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </CardContent>
          </Card>
      )
  }
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Artifact Modules</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Artifact Modules</CardTitle>
          <CardDescription>
            Enable or disable modules to add or remove functionality from this site.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
           <div className="space-y-4">
                {allPossibleModules.map((moduleDef, index) => (
                    <div key={moduleDef.id}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1 pr-4">
                                <Label htmlFor={moduleDef.id} className="text-base font-medium">
                                    {moduleDef.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">{moduleDef.description}</p>
                            </div>
                            <Switch
                                id={moduleDef.id}
                                checked={modules[moduleDef.id]?.active || false}
                                onCheckedChange={(checked) => handleToggle(moduleDef.id, checked)}
                            />
                        </div>
                        {index < allPossibleModules.length - 1 && <Separator />}
                   </div>
                ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
