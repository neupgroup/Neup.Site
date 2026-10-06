import Link from 'next/link';
import { ArrowRight, Blocks, Plus } from 'lucide-react';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function BlocksPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;
  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Blocks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage reusable content blocks for your site.</p>
        </div>
      </header>
      <div className="grid gap-4">
        <Link
          href={appendProject('/blocks/templates', project)}
          className="grid h-auto w-full grid-cols-[auto_1fr_auto] items-center justify-start gap-4 rounded-lg border bg-card px-5 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Blocks className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">Block templates</span>
            <span className="block text-sm text-muted-foreground">Browse and create reusable block templates.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={appendProject('/blocks/new', project)}
          className="grid h-auto w-full grid-cols-[auto_1fr_auto] items-center justify-start gap-4 rounded-lg border border-dashed bg-card px-5 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">Create a block</span>
            <span className="block text-sm text-muted-foreground">Start a new content block.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">No blocks have been created yet.</div>
    </div>
  );
}
