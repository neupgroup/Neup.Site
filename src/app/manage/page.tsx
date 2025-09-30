import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ManagePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-8">Manage</h1>
      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Global site settings and configurations will go here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
