'use client';

import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Textarea } from '@neup/components/ui/textarea';
import { useToast } from '@neup/core/hooks/useToast';
import { appendProject } from '@/inapp/helpers/application-mode';
import { getBlockForEdit, updateBlock } from '@/services/editor/blocks';

function parseBlockReference(reference: string) {
  const match = reference.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})--([a-z0-9]+(?:-[a-z0-9]+)*)$/i);
  return match ? { id: match[1], slug: match[2] } : null;
}

type BlockRecord = { id: string; name: string; slug: string; payload: unknown };

export default function EditBlockPage() {
  const { slug: rawId } = useParams<{ slug: string }>();
  const reference = parseBlockReference(rawId);
  if (!reference) notFound();
  const { id } = reference;
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = searchParams.get('project')?.trim() || null;
  const { toast } = useToast();
  const [block, setBlock] = useState<BlockRecord | null>(null);
  const [name, setName] = useState('');
  const [payload, setPayload] = useState('{}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const record = await getBlockForEdit(id);
      if (cancelled) return;
      if (record) {
        setBlock(record);
        setName(record.name);
        if (record.slug !== reference.slug) {
          setBlock(null);
        }
        setPayload(JSON.stringify(record.payload ?? {}, null, 2));
      }
      setLoading(false);
    }
    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    let parsedPayload: unknown;
    try { parsedPayload = JSON.parse(payload); } catch { setError('Payload must be valid JSON.'); return; }
    setSaving(true);
    const result = await updateBlock({ id, name, payload: parsedPayload });
    setSaving(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Could not update block', description: result.error });
      return;
    }
    toast({ title: 'Block updated', description: `${name.trim()} has been saved.` });
    router.push(appendProject(`/blocks/${id}--${block.slug}`, project));
    router.refresh();
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading block…</div>;
  if (!block) return <div className="w-full max-w-3xl space-y-4"><p className="text-sm text-muted-foreground">Block not found in the active project.</p><Link href={appendProject('/blocks', project)} className="text-sm text-primary hover:underline">Back to blocks</Link></div>;

  return <div className="w-full max-w-3xl space-y-6">
    <Link href={appendProject(`/blocks/${block.id}--${block.slug}`, project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to block</Link>
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader><CardTitle>Edit Block</CardTitle><CardDescription>Update the block name and JSON payload.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><label htmlFor="block-name" className="text-sm font-medium">Block name</label><Input id="block-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div>
          <div className="space-y-2"><label htmlFor="block-payload" className="text-sm font-medium">Payload (JSON)</label><Textarea id="block-payload" value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} className="font-mono text-sm" spellCheck={false} required />{error && <p className="text-sm text-destructive">{error}</p>}</div>
        </CardContent>
        <CardFooter><Button variant="solid" htmlType="submit" disabled={saving || !name.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? 'Saving…' : 'Save changes'}</Button></CardFooter>
      </Card>
    </form>
  </div>;
}
