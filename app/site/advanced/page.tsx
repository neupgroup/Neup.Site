
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Label } from '#/components/ui/label';
import { Switch } from '#/components/ui/switch';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { useState } from 'react';

export default function AdvancedSettingsPage() {
    usePageTitle('Advanced Settings');
    const [isCustomHost, setIsCustomHost] = useState(false);
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Advanced Settings</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Custom Hosting</CardTitle>
          <CardDescription>
            Enable advanced features for custom codebase deployments.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="custom-host-mode" className="text-base">
                    Enable Custom Host Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                    This will unlock the 'Codebase' section for manual file uploads and deployments.
                    </p>
                </div>
                <Switch
                    id="custom-host-mode"
                    checked={isCustomHost}
                    onCheckedChange={setIsCustomHost}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
