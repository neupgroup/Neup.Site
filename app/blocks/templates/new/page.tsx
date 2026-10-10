'use client';

import { Link } from '@neup/components/ui/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { useToast } from '@neup/core/hooks/useToast';
import { saveBlockTemplate } from '@/services/editor/block-templates';
import { appendProject } from '@/inapp/helpers/application-mode';

export default function NewBlockTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = searchParams.get('project')?.trim() || null;
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const templateName = name.trim();
    if (!templateName) return;

    setSaving(true);
    const result = await saveBlockTemplate({ name: templateName, type: 'section' });
    setSaving(false);

    if (result.success === false) {
      toast({ variant: 'destructive', title: 'Could not create template', description: result.error });
      return;
    }

    toast({ title: 'Template created', description: `${templateName} has been saved as a draft.` });
    router.push(appendProject(`/blocks/templates/${result.slug}--${result.id}`, project));
    router.refresh();
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full space-y-8">
      <Link href={appendProject('/blocks/templates', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />Back to templates
      </Link>
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight">New Block Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">Give your reusable block template a name.</p>
      </header>
      <form onSubmit={onSubmit} className="w-full space-y-6">
        <div className="w-full space-y-2">
          <label htmlFor="template-name" className="text-sm font-medium">Template name</label>
          <Input id="template-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Feature grid" required maxLength={120} autoFocus />
        </div>
        <Button variant="solid" htmlType="submit" disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving…' : 'Continue to editor'}
        </Button>
      </form>
    </main>
  );
}
