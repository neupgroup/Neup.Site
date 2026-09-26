'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { LinkButton } from '@neup/components/ui/link-button';
import { Label } from '@neup/components/ui/label';
import { Separator } from '@neup/components/ui/separator';
import { Switch } from '@neup/components/ui/switch';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import { useToast } from '@neup/core/hooks/useToast';
import { getSiteModules, updateSiteModule } from '@/services/modules';
import allPossibleModules from '@/services/site/modules/list.json';
import { useEffect, useState } from 'react';

export default function ModulePage() {
  const params = useParams<{ moduleId: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const moduleDefinition = allPossibleModules.find((module) => module.id === params.moduleId);
  const [active, setActive] = useState(false);
  const [modulePayload, setModulePayload] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  usePageTitle(moduleDefinition?.name || 'Module');

  useEffect(() => {
    getSiteModules().then((result) => {
      if (result.success) {
        const payload = result.modules?.[params.moduleId] || { active: false };
        setActive(Boolean(payload.active));
        setModulePayload({ id: params.moduleId, ...payload });
      }
      else setError(result.error || 'Failed to fetch module.');
    });
  }, [params.moduleId]);

  if (!moduleDefinition) {
    return <Alert variant="destructive"><AlertTitle>Module not found</AlertTitle><AlertDescription>The requested module does not exist.</AlertDescription></Alert>;
  }

  const handleToggle = async (checked: boolean) => {
    setActive(checked);
    setModulePayload((current) => ({ ...current, active: checked }));
    const result = await updateSiteModule(moduleDefinition.id, checked);
    if (!result.success) {
      setActive(!checked);
      setModulePayload((current) => ({ ...current, active: !checked }));
      toast({ variant: 'destructive', title: 'Error updating module', description: result.error });
      return;
    }
    toast({ title: 'Module Updated', description: `${moduleDefinition.name} has been ${checked ? 'enabled' : 'disabled'}.` });
  };

  const query = searchParams.toString();
  const modulesHref = query ? `/modules?${query}` : '/modules';

  return (
    <div className="w-full">
      <LinkButton variant="outlined" href={modulesHref} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Modules
      </LinkButton>
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">{moduleDefinition.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{moduleDefinition.description}</p>
      </header>
      <div className="overflow-hidden rounded-md border">
        {error ? <Alert variant="destructive" className="m-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="flex items-center justify-between p-4">
          <div>
            <Label htmlFor="module-active" className="text-base font-medium">Enable module</Label>
            <p className="text-sm text-muted-foreground">Turn this module on for the current site.</p>
          </div>
          <Switch id="module-active" checked={active} onCheckedChange={handleToggle} />
        </div>
        <Separator />
        <div className="p-4 text-sm text-muted-foreground">Module ID: <span className="font-mono">{moduleDefinition.id}</span></div>
        <Separator />
        <div className="p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">Module payload</h2>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{JSON.stringify(modulePayload, null, 2)}</code></pre>
        </div>
      </div>
    </div>
  );
}
