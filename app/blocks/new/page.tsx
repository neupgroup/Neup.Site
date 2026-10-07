'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Blocks, Loader2, Save } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Textarea } from '@neup/components/ui/textarea';
import { useToast } from '@neup/core/hooks/useToast';
import { saveSection } from '@/services/editor/sections';
import { appendProject } from '@/inapp/helpers/application-mode';

export default function NewBlockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = searchParams.get('project')?.trim() || null;
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('section');
  const [content, setContent] = useState('[\n  {\n    "type": "text",\n    "content": "Your block content"\n  }\n]');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      JSON.parse(content);
    } catch {
      setError('Content must be valid JSON.');
      return;
    }
    setSaving(true);
    const result = await saveSection({ name: name.trim(), type: type.trim() || 'section', content, createdBy: 'user' });
    setSaving(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Could not create block', description: result.error });
      return;
    }
    toast({ title: 'Block created', description: `${name.trim()} has been saved.` });
    router.push(appendProject('/blocks', project));
    router.refresh();
  }

  return <div className="w-full max-w-3xl space-y-6">
    <Link href={appendProject('/blocks', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to blocks</Link>
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Blocks className="h-5 w-5" />New Block</CardTitle><CardDescription>Create a reusable content block for the active project. Content is stored as JSON.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><label htmlFor="block-name" className="text-sm font-medium">Block name</label><Input id="block-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Hero banner" required maxLength={120} /></div>
          <div className="space-y-2"><label htmlFor="block-type" className="text-sm font-medium">Type</label><select id="block-type" value={type} onChange={(event) => setType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="page">Page</option><option value="section">Section</option><option value="element">Element</option></select></div>
          <div className="space-y-2"><label htmlFor="block-content" className="text-sm font-medium">Content (JSON)</label><Textarea id="block-content" value={content} onChange={(event) => setContent(event.target.value)} rows={16} className="font-mono text-sm" spellCheck={false} required aria-describedby={error ? 'block-content-error' : undefined} />{error && <p id="block-content-error" className="text-sm text-destructive">{error}</p>}</div>
        </CardContent>
        <CardFooter><Button variant="solid" htmlType="submit" disabled={saving || !name.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? 'Saving…' : 'Create block'}</Button></CardFooter>
      </Card>
    </form>
  </div>;
}
