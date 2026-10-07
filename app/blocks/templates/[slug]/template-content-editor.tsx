'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Save } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Textarea } from '@neup/components/ui/textarea';
import { useToast } from '@neup/core/hooks/useToast';
import { updateBlockTemplateContent } from '@/services/editor/block-templates';

type EditorKind = 'code' | 'payload' | 'description';

export function TemplateContentEditor({ id, kind, initialValue }: { id: string; kind: EditorKind; initialValue: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isCode = kind === 'code';
  const isDescription = kind === 'description';

  async function save() {
    let payload: unknown;
    if (kind === 'payload') {
      try {
        payload = JSON.parse(value);
      } catch {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'Enter a valid JSON payload.' });
        return;
      }
    }
    setSaving(true);
    const result = await updateBlockTemplateContent({
      id,
      ...(isCode ? { code: value } : isDescription ? { description: value } : { payload }),
    });
    setSaving(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Could not save changes', description: result.error });
      return;
    }
    setEditing(false);
    toast({ title: isCode ? 'Codebase saved' : isDescription ? 'Description saved' : 'Payload format saved' });
    router.refresh();
  }

  return <div className="space-y-3">
    {editing ? <>
      <Textarea aria-label={isCode ? 'Codebase' : isDescription ? 'Description' : 'Payload format'} value={value} onChange={(event) => setValue(event.target.value)} rows={isDescription ? 4 : 14} className={isCode || kind === 'payload' ? 'font-mono text-sm' : 'text-sm'} spellCheck={!isCode && kind !== 'payload'} placeholder={isCode ? 'Paste code here…' : isDescription ? 'Add a description…' : '{\n  "key": "value"\n}'} />
      {kind === 'payload' && <p className="text-xs text-muted-foreground">Payload must be valid JSON.</p>}
      <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? 'Saving…' : 'Save'}</Button><Button variant="outline" onClick={() => { setValue(initialValue); setEditing(false); }} disabled={saving}>Cancel</Button></div>
    </> : <>
      {isDescription ? <div className="flex items-start gap-1">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value || 'No description added.'}</p>
        <Button variant="ghost" size="icon" aria-label="Edit description" onClick={() => setEditing(true)} className="-mt-1 h-7 w-7 shrink-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </div> : <>
        {value ? <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-relaxed"><code>{value}</code></pre> : <button type="button" onClick={() => setEditing(true)} className="w-full rounded-md border border-dashed px-4 py-8 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">{isCode ? 'Add code.' : 'Add payload here.'}</button>}
        {value && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Edit {isCode ? 'codebase' : 'payload format'}</Button>}
      </>}
    </>}
  </div>;
}
