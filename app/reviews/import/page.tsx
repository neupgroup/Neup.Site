import { Link } from '@neup/components/ui/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function ImportReviewsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Link href={appendProject('/reviews', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reviews</Link>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Reviews</CardTitle><CardDescription>Import reviews from a CSV file.</CardDescription></CardHeader>
        <CardContent className="space-y-4"><input type="file" accept=".csv" className="block w-full rounded-md border p-2 text-sm" /><Button type="button">Import Reviews</Button></CardContent>
      </Card>
    </div>
  );
}
