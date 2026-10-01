import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const project = query.project?.trim() || null;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Link href={appendProject('/products', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Product</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Product: {slug}</p>
        </CardContent>
      </Card>
    </div>
  );
}
