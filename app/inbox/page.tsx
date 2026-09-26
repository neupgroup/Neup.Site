import Link from 'next/link';
import { getFormSubmissions } from '@/services/forms';
import { LinkButton } from '@neup/components/ui/link-button';
import { Inbox, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default async function InboxPage() {
  const submissions = await getFormSubmissions();
  return <div className="w-full max-w-5xl space-y-6"><div className="flex items-center justify-between"><div><h1 className="font-headline text-2xl font-semibold">Inbox</h1><p className="text-sm text-muted-foreground">Contact form submissions from your projects.</p></div><LinkButton href="/inbox/create"><Plus className="mr-2 h-4 w-4" />Create form</LinkButton></div>{submissions.length ? <div className="divide-y rounded-lg border bg-card">{submissions.map((item) => <Link key={item.id} href={`/inbox/${item.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40"><div className="flex items-center gap-3"><Inbox className="h-4 w-4 text-muted-foreground" /><div><div className="font-medium">{item.form.name}</div><div className="text-sm text-muted-foreground">{format(item.postedOn, 'PPP p')}</div></div></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{item.status}</span></Link>)}</div> : <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">No submissions received yet.</div>}</div>;
}
