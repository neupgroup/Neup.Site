import { Link } from '@neup/components/ui/link';
import { ArrowLeft, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function ProductListPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ project?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = query.project?.trim() || null;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Link href={appendProject('/products', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Products</Link>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><List className="h-5 w-5" /> Category, List</CardTitle><CardDescription>Manage products in this category or list.</CardDescription></CardHeader>
        <CardContent><p className="text-muted-foreground">List: {id}</p></CardContent>
      </Card>
    </div>
  );
}
