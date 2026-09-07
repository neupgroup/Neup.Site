import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

export default function ExportSettingsPage() {
  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground">Export site configuration and content.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Export tools will be available here.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
