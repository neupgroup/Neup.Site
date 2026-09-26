'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createActiveFormSubmission, type FormField } from '@/services/forms';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { LinkButton } from '@neup/components/ui/link-button';
import { ArrowLeft } from 'lucide-react';
import { appendProject } from '@/inapp/helpers/application-mode';

type FormOption = { id: string; name: string; fields: unknown };
export default function SubmissionForm({ forms, project }: { forms: FormOption[]; project: string | null }) {
  const router = useRouter(); const [formId, setFormId] = useState(forms[0]?.id || ''); const [values, setValues] = useState<Record<string, string>>({}); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const form = forms.find((item) => item.id === formId); const fields = Array.isArray(form?.fields) ? form.fields as FormField[] : [];
  const submit = async () => { setSaving(true); setError(''); try { await createActiveFormSubmission(formId, values); router.push('/inbox'); } catch (exception) { setError(exception instanceof Error ? exception.message : 'Unable to create submission.'); setSaving(false); } };
  return <div className="w-full max-w-2xl space-y-6"><LinkButton variant="outlined" href={appendProject('/inbox', project)}><ArrowLeft className="mr-2 h-4 w-4" />Back to Inbox</LinkButton><div><h1 className="font-headline text-2xl font-semibold">New submission</h1><p className="text-sm text-muted-foreground">Create a submission from the app itself.</p></div>{forms.length ? <div className="space-y-5 rounded-lg border bg-card p-5"><div className="space-y-2"><label className="text-sm font-medium">Form</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formId} onChange={(event) => { setFormId(event.target.value); setValues({}); }}>{forms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>{fields.map((field) => <div key={field.name} className="space-y-2"><label className="text-sm font-medium">{field.label || field.name}{field.required ? ' *' : ''}</label><Input type={field.type === 'textarea' ? 'text' : field.type} value={values[field.name] || ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} /></div>)}{error && <p className="text-sm text-destructive">{error}</p>}<Button variant="solid" type="button" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Create submission'}</Button></div> : <div className="rounded-lg border-2 border-dashed p-10 text-center text-muted-foreground">Create a form before adding a submission.</div>}</div>;
}
