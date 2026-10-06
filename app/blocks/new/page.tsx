import Link from 'next/link';
import { ArrowLeft, Blocks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@neup/components/ui/card';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function NewBlockPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;
  return <div className="w-full max-w-3xl space-y-6">
    <Link href={appendProject('/blocks', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to blocks</Link>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Blocks className="h-5 w-5" />New Block</CardTitle><CardDescription>Create a reusable content block for your site.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Block creation is ready to be connected to block data.</p></CardContent></Card>
  </div>;
}
