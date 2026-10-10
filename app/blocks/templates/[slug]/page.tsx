import { Link } from '@neup/components/ui/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Braces, Code2, Image } from 'lucide-react';
import { appendProject } from '@/inapp/helpers/application-mode';
import { prisma as db } from '@neup/core/database/prisma';
import { TemplateCoverEditor } from './template-cover-editor';
import { TemplateContentEditor } from './template-content-editor';

function getCoverUrl(media: unknown): string {
  if (typeof media === 'string') return media;
  if (!media || typeof media !== 'object' || Array.isArray(media)) return '';
  const value = media as Record<string, unknown>;
  const cover = value.cover ?? value.coverUrl ?? value.image ?? value.url;
  return typeof cover === 'string' ? cover : '';
}

function parseBlockReference(reference: string) {
  const match = reference.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)--([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return match ? { slug: match[1], id: match[2] } : null;
}

export default async function BlockTemplatePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ project?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const reference = parseBlockReference(slug);
  if (!reference) notFound();
  const [project, template] = await Promise.all([
    Promise.resolve(query.project?.trim() || null),
    db.blockTemplate.findUnique({ where: { id: reference.id }, select: { id: true, name: true, slug: true, type: true, description: true, version: true, code: true, payload: true, compatibility: true, media: true } }),
  ]);
  if (!template || template.slug !== reference.slug) notFound();
  const payload = template.payload == null ? '' : JSON.stringify(template.payload, null, 2);
  return <div className="w-full space-y-8">
    <Link href={appendProject('/blocks/templates', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to templates</Link>
    <header><h1 className="font-headline text-2xl font-semibold tracking-tight">{template.name}</h1><p className="mt-1 text-sm text-muted-foreground">{template.type}{template.version ? ` · v${template.version}` : ''}</p></header>
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Image className="h-5 w-5" />Cover image</h2>
      <TemplateCoverEditor id={template.id} initialUrl={getCoverUrl(template.media)} />
    </section>
    <TemplateContentEditor id={template.id} kind="description" initialValue={template.description || ''} />
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Code2 className="h-5 w-5" />Codebase</h2>
      <TemplateContentEditor id={template.id} kind="code" initialValue={template.code || ''} />
    </section>
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Braces className="h-5 w-5" />Payload format</h2>
      <TemplateContentEditor id={template.id} kind="payload" initialValue={payload} />
    </section>
  </div>;
}
