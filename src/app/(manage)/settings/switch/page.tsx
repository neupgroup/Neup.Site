
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { logout } from '@/actions/auth/logout';
import { usePageTitle } from '@/hooks/use-page-title';

export default function SwitchAccountPage() {
  const router = useRouter();
  usePageTitle('Auth Settings');

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      router.push('/auth');
      router.refresh(); // Ensure the page reloads to clear any client-side state
    };
    
    handleLogout();
  }, [router]);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Switch Account</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Switching Account</CardTitle>
          <CardDescription>
            Clearing your session and redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
            <p className="mt-4">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
