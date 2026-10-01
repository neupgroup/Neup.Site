import Link from 'next/link';
import { ArrowLeft, MessageSquareQuote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';
import { appendProject } from '@/inapp/helpers/application-mode';
import { prisma as db } from '@neup/core/database/prisma';
import { deleteReview } from '@/services/reviews';
import { redirect } from 'next/navigation';

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ project?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = query.project?.trim() || null;
  const review = await db.review.findFirst({
    where: { id, ...(project ? { projectId: project } : {}) },
  });
  async function removeReview() {
    'use server';
    await deleteReview({ id, projectId: project || '' });
    redirect(appendProject('/reviews', project));
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Link href={appendProject('/reviews', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reviews</Link>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Review</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        {review ? <>
          <p><span className="font-medium">Reviewer:</span> {review.reviewer}</p>
          <p><span className="font-medium">Content:</span> {review.content || '—'}</p>
          <p><span className="font-medium">Rating:</span> {review.rating}/5</p>
          <p><span className="font-medium">Created:</span> {review.createdOn.toLocaleString()}</p>
          <p><span className="font-medium">Reply:</span> {review.reply || '—'}</p>
          <p><span className="font-medium">Replied:</span> {review.repliedOn?.toLocaleString() || '—'}</p>
          <form action={removeReview} className="pt-4"><button type="submit" className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">Delete Review</button></form>
        </> : <p className="text-muted-foreground">Review not found.</p>}
      </CardContent></Card>
    </div>
  );
}
