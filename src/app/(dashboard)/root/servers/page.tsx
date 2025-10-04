
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ServersPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Servers</h1>
         <Button>
            <Plus className="mr-2 h-4 w-4" /> Connect Server
          </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Servers Connected</h3>
            <p>Connect a server to deploy your sites.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
