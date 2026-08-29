'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { useState } from 'react';

// This is a placeholder for a real check against your site's status in Firestore
const useSiteStatus = () => {
    // For now, we'll simulate a 'pending' status to show the page content.
    // In a real app, you would fetch this from Firestore based on the current assetId.
    const [status] = useState('pending'); // 'pending' | 'active' | 'inactive'
    return { status, isLoading: false };
}


export default function OnboardingPage() {
    const { status, isLoading } = useSiteStatus();

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (status !== 'pending') {
        return (
             <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Onboarding Complete</CardTitle>
                        <CardDescription>
                            This page is only accessible during the initial site setup.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <a href="/">Go to Dashboard</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Welcome to Neup.Sites Onboarding</CardTitle>
          <CardDescription>
            Let's get your new site up and running.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Onboarding steps will go here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
