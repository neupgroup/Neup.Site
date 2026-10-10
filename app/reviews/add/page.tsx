'use client';

import { Link } from '@neup/components/ui/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Button } from '@neup/components/ui/button';
import { appendProject } from '@/inapp/helpers/application-mode';
import { createReview } from '@/services/reviews';

export default function AddReviewPage() {
  const router = useRouter();
  const project = useSearchParams().get('project')?.trim() || '';
  const [reviewer, setReviewer] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('5');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createReview({ projectId: project, reviewer, content, rating: Number(rating), reply });
    if (result.error) { setError(result.error); setSaving(false); return; }
    router.push(appendProject(`/reviews/${result.review?.id}`, project));
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Link href={appendProject('/reviews', project)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reviews</Link>
      <Card><CardHeader><CardTitle>Add Review</CardTitle><CardDescription>Add a customer review manually.</CardDescription></CardHeader><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><label htmlFor="reviewer" className="text-sm font-medium">Reviewer</label><Input id="reviewer" value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Customer name" required /></div>
          <div className="space-y-2"><label htmlFor="content" className="text-sm font-medium">Content <span className="text-muted-foreground">(optional)</span></label><textarea id="content" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Write the review" /></div>
          <div className="space-y-2"><label htmlFor="rating" className="text-sm font-medium">Rating</label><Input id="rating" value={rating} onChange={(event) => setRating(event.target.value)} type="number" min="1" max="5" required /></div>
          <div className="space-y-2"><label htmlFor="reply" className="text-sm font-medium">Reply <span className="text-muted-foreground">(optional)</span></label><textarea id="reply" value={reply} onChange={(event) => setReply(event.target.value)} className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Reply to the review" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Review'}</Button>
        </form>
      </CardContent></Card>
    </div>
  );
}
