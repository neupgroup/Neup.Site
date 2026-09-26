import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/services/forms';
import { LinkButton } from '@neup/components/ui/link-button';
import { ArrowLeft, Plus } from 'lucide-react';
export default async function FormDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const form = await getFormBySlug((await params).slug); if (!form) notFound();
  const fields = Array.isArray(form.fields) ? form.fields as Array<{ name: string; label: string; type: string }> : [];
  return <div className="w-full max-w-3xl space-y-6"><LinkButton variant="outlined" href="/inbox/forms"><ArrowLeft className="mr-2 h-4 w-4" />Back to Forms</LinkButton><div className="flex items-start justify-between gap-4"><div><h1 className="font-headline text-2xl font-semibold">{form.name}</h1><p className="text-sm text-muted-foreground">/{form.slug}</p></div><LinkButton href="/inbox/create"><Plus className="mr-2 h-4 w-4" />Create form</LinkButton></div><div className="space-y-3 rounded-lg border bg-card p-5"><h2 className="font-medium">Form fields</h2>{fields.map((field) => <div key={field.name} className="flex items-center justify-between rounded-md border p-3"><div><div className="font-medium">{field.label || field.name}</div><div className="text-sm text-muted-foreground">{field.name}</div></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{field.type}</span></div>)}</div></div>;
}
