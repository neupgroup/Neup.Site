import { Link } from '@neup/components/ui/link';
import { MessageSquareQuote } from 'lucide-react';
import { appendProject } from '@/inapp/helpers/application-mode';
import { prisma as db } from '@neup/core/database/prisma';

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;
  const reviews = project
    ? await db.review.findMany({ where: { projectId: project }, orderBy: { createdOn: 'desc' } })
    : [];

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">Manage customer reviews for this site.</p>
        </div>
      </header>
      <div className="space-y-4">
        <Link href={appendProject('/reviews/add', project)} className="grid gap-4 rounded-lg border border-dashed bg-card px-5 py-4 transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr] md:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MessageSquareQuote className="h-5 w-5 text-muted-foreground" /></span>
          <span><span className="block font-medium">Add Review</span><span className="block text-sm text-muted-foreground">Add a customer review to this site.</span></span>
        </Link>
        <Link href={appendProject('/reviews/import', project)} className="grid gap-4 rounded-lg border border-dashed bg-card px-5 py-4 transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr] md:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MessageSquareQuote className="h-5 w-5 text-muted-foreground" /></span>
          <span><span className="block font-medium">Import Reviews</span><span className="block text-sm text-muted-foreground">Import reviews from a CSV file.</span></span>
        </Link>
        {reviews.length ? (
          <div className="space-y-4">{reviews.map((review) => (
              <Link key={review.id} href={appendProject(`/reviews/${review.id}`, project)} className="block w-full rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{review.reviewer}</div>
                  <div className="text-sm text-muted-foreground">{review.rating}/5</div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{review.content || 'No review content.'}</p>
                <p className="mt-3 text-xs text-muted-foreground">{review.createdOn.toLocaleDateString()}</p>
              </Link>
            ))}</div>
        ) : (
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            <MessageSquareQuote className="mx-auto mb-4 h-12 w-12" />
            <p>No reviews have been added yet.</p>
            <Link href={appendProject('/reviews/add', project)} className="mt-4 inline-block text-sm text-primary hover:underline">Add your first review</Link>
          </div>
        )}
      </div>
    </div>
  );
}
