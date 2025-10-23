
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Repeat } from 'lucide-react';

export default function SwitchAccountPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Switch Account</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Switch Active Site</CardTitle>
          <CardDescription>
            Functionality to switch between different sites will be available here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Repeat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Account switching is coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
