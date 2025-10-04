
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const initialModules = [
    { id: 'user', name: 'User Module', description: 'Manages user authentication and profiles.', enabled: true },
    { id: 'neupid', name: 'NeupID Module', description: 'Integrates with NeupID for single sign-on.', enabled: false },
    { id: 'analytics', name: 'Analytics Module', description: 'Tracks user engagement and site metrics.', enabled: true },
    { id: 'ad', name: 'Ad Module', description: 'Manages and displays advertisements.', enabled: false },
    { id: 'social', name: 'Social Module', description: 'Handles social sharing and feeds.', enabled: false },
    { id: 'meta-pixel', name: 'Meta Pixel Module', description: 'Integrates with Meta Pixel for tracking.', enabled: false },
    { id: 'news', name: 'News Module', description: 'Adds a news/articles section to your site.', enabled: false },
    { id: 'blog', name: 'Blog Module', description: 'Adds a blog section to your site.', enabled: true },
    { id: 'database', name: 'Database Integration', description: 'Connects to a database for dynamic content.', enabled: false },
    { id: 'google-analytics', name: 'Google Analytics Integration', description: 'Integrates with Google Analytics for detailed tracking.', enabled: false },
    { id: 'payment', name: 'Payment Processing Module', description: 'Handles payments and subscriptions.', enabled: false },
];

export default function ModulesPage() {
  const [modules, setModules] = useState(initialModules);

  const handleToggle = (moduleId: string, checked: boolean) => {
    setModules(prevModules =>
      prevModules.map(module =>
        module.id === moduleId ? { ...module, enabled: checked } : module
      )
    );
    // Here you would typically call a server action to persist the change.
  };
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Modules</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Site Modules</CardTitle>
          <CardDescription>
            Enable or disable modules to add or remove functionality from your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
                {modules.map((module, index) => (
                    <div key={module.id}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1 pr-4">
                                <Label htmlFor={module.id} className="text-base font-medium">
                                    {module.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                            <Switch
                                id={module.id}
                                checked={module.enabled}
                                onCheckedChange={(checked) => handleToggle(module.id, checked)}
                            />
                        </div>
                        {index < modules.length - 1 && <Separator />}
                   </div>
                ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
