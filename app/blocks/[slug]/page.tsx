import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Blocks, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';
import { appendProject } from '@/inapp/helpers/application-mode';

function parseBlockReference(reference: string) {
  const match = reference.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})--([a-z0-9]+(?:-[a-z0-9]+)*)$/i);
  return match ? { id: match[1], slug: match[2] } : null;
}

export default async function BlockPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ project?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const reference = parseBlockReference(slug);
  if (!reference) notFound();
  const project = query.project?.trim() || null;
  return <div className="w-full max-w-3xl space-y-6">
    <Link href={appendProject('/blocks', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to blocks</Link>
    <Link href={appendProject(`/blocks/${slug}/edit`, project)} className="inline-flex items-center text-sm text-primary hover:underline"><Pencil className="mr-2 h-4 w-4" />Edit block</Link>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Blocks className="h-5 w-5" />{reference.slug.replace(/-/g, ' ')}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Block details will appear here.</p><p className="font-mono text-xs text-muted-foreground">ID: {reference.id}</p></CardContent></Card>
  </div>;
}
