
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Label } from '#/components/ui/label';
import { Switch } from '#/components/ui/switch';
import { useState } from 'react';
import { Separator } from '#/components/ui/separator';
import { usePageTitle } from '#/core/hooks/use-page-title';

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

export default function ModulesPage() {
    usePageTitle('Root Modules', 'NeupSites');
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Root Modules</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Global Module Definitions</CardTitle>
          <CardDescription>
            This is a global list of all possible modules available in the system. Enable or disable modules for individual sites under "Asset" &gt; "Modules".
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
                {allPossibleModules.map((module, index) => (
                    <div key={module.id}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1 pr-4">
                                <p className="text-base font-medium">
                                    {module.name}
                                </p>
                                <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                            <p className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">{module.id}</p>
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
