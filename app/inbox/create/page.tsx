'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createForm, type FormField } from '@/services/forms';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Textarea } from '@neup/components/ui/textarea';
import { LinkButton } from '@neup/components/ui/link-button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function CreateFormPage() {
  const router = useRouter();
  const [name, setName] = useState('Contact form');
  const [slug, setSlug] = useState('contact');
  const [fields, setFields] = useState<FormField[]>([{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'message', label: 'Message', type: 'textarea', required: true }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (index: number, patch: Partial<FormField>) => setFields((current) => current.map((field, i) => i === index ? { ...field, ...patch } : field));
  const save = async () => { setSaving(true); setError(''); const result = await createForm({ name, slug, fields }); if (result.success) router.push('/forms'); else { setError(result.error || 'Unable to create form.'); setSaving(false); } };
  return <div className="w-full max-w-3xl space-y-6"><LinkButton variant="outlined" href="/forms"><ArrowLeft className="mr-2 h-4 w-4" />Back to Forms</LinkButton><div><h1 className="font-headline text-2xl font-semibold">Create form</h1><p className="text-sm text-muted-foreground">Define the fields your visitors can submit.</p></div><div className="space-y-4 rounded-lg border bg-card p-5"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Form name" /><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" />{fields.map((field, index) => <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_140px_auto]"><Input value={field.label} onChange={(e) => update(index, { label: e.target.value, name: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') })} placeholder="Label" /><Input value={field.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Field name" /><Input value={field.type} onChange={(e) => update(index, { type: e.target.value })} placeholder="Type" /><Button variant="ghost" type="button" onClick={() => setFields(fields.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outlined" type="button" onClick={() => setFields([...fields, { name: `field_${fields.length + 1}`, label: '', type: 'text' }])}><Plus className="mr-2 h-4 w-4" />Add field</Button>{error && <p className="text-sm text-destructive">{error}</p>}<div><Button variant="solid" type="button" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save form'}</Button></div></div></div>;
}
