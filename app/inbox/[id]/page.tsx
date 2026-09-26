import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormSubmission } from '@/services/forms';
import { LinkButton } from '@neup/components/ui/link-button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const submission = await getFormSubmission((await params).id);
  if (!submission) notFound();
  return <div className="w-full max-w-3xl space-y-6"><LinkButton variant="outlined" href="/inbox"><ArrowLeft className="mr-2 h-4 w-4" />Back to Inbox</LinkButton><div><h1 className="font-headline text-2xl font-semibold">{submission.form.name}</h1><p className="text-sm text-muted-foreground">Received {format(submission.postedOn, 'PPP p')} · {submission.status}</p></div><div className="rounded-lg border bg-card p-5"><pre className="overflow-auto whitespace-pre-wrap text-sm">{JSON.stringify(submission.response, null, 2)}</pre></div></div>;
}
