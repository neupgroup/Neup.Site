import Link from 'next/link';
import { getForms } from '@/services/forms';
import { LinkButton } from '@neup/components/ui/link-button';
import { Plus } from 'lucide-react';

export default async function FormsPage() {
  const forms = await getForms();
  return <div className="w-full max-w-4xl space-y-6"><div className="flex items-center justify-between"><div><h1 className="font-headline text-2xl font-semibold">Forms</h1><p className="text-sm text-muted-foreground">Manage forms that collect submissions.</p></div><LinkButton href="/inbox/create"><Plus className="mr-2 h-4 w-4" />Create form</LinkButton></div><div className="grid gap-3">{forms.map((form) => <Link key={form.id} href={`/inbox/create?form=${form.id}`} className="rounded-lg border bg-card p-4 hover:border-primary"><div className="font-medium">{form.name}</div><div className="text-sm text-muted-foreground">/{form.slug} · {Array.isArray(form.fields) ? form.fields.length : 0} fields</div></Link>)}{!forms.length && <div className="rounded-lg border-2 border-dashed p-10 text-center text-muted-foreground">No forms yet.</div>}</div></div>;
}
