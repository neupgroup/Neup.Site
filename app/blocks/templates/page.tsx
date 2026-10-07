import Link from 'next/link';
import { ArrowRight, Blocks, Plus } from 'lucide-react';
import { appendProject } from '@/inapp/helpers/application-mode';
import { prisma as db } from '@neup/core/database/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';

export default async function BlockTemplatesPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const [{ project: rawProject }, templates] = await Promise.all([
    searchParams,
    db.blockTemplate.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, type: true, description: true, version: true } }),
  ]);
  const project = rawProject?.trim() || null;
  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <div><h1 className="font-headline text-2xl font-semibold tracking-tight">Block Templates</h1><p className="mt-1 text-sm text-muted-foreground">Manage reusable starting points for blocks.</p></div>
      </header>
      <div className="grid gap-4">
        <Link
          href={appendProject('/blocks/templates/new', project)}
          className="grid h-auto w-full grid-cols-[auto_1fr_auto] items-center justify-start gap-4 rounded-lg border border-dashed bg-card px-5 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">New template</span>
            <span className="block text-sm text-muted-foreground">Create a reusable block template.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">No block templates have been created yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Link key={template.id} href={appendProject(`/blocks/templates/${template.slug}--${template.id}`, project)} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardHeader className="flex flex-row items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"><Blocks className="h-5 w-5 text-muted-foreground" /></span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{template.name}</CardTitle>
                    <CardDescription className="mt-1">{template.type}{template.version ? ` · v${template.version}` : ''}</CardDescription>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </CardHeader>
                {template.description && <CardContent className="pt-0 text-sm text-muted-foreground">{template.description}</CardContent>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
