import { Link } from '@neup/components/ui/link';
import { ArrowLeft, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Button } from '@neup/components/ui/button';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const project = (await searchParams).project?.trim() || null;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Link href={appendProject('/products', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Create Product</CardTitle>
          <CardDescription>Add a product to this site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="product-name" className="text-sm font-medium">Product name</label>
            <Input id="product-name" placeholder="Product name" />
          </div>
          <Button type="button">Create Product</Button>
        </CardContent>
      </Card>
    </div>
  );
}
