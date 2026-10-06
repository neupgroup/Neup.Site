import { Plus } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function BlockTemplatesPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;
  return (
    <div className="w-full space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div><h1 className="font-headline text-2xl font-semibold tracking-tight">Block Templates</h1><p className="mt-1 text-sm text-muted-foreground">Manage reusable starting points for blocks.</p></div>
        <LinkButton href={appendProject('/blocks/templates/new', project)}><Plus className="mr-2 h-4 w-4" />New Template</LinkButton>
      </header>
      <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">No block templates have been created yet.</div>
    </div>
  );
}
