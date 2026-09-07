import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

export default function ImportSettingsPage() {
  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Import</h1>
        <p className="text-muted-foreground">Import site configuration and content.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
          <CardDescription>Import tools will be available here.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
