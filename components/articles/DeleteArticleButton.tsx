'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { deleteArticle } from '@/services/articles';
import { Button } from '@neup/components/ui/button';

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleDelete() {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;

    const result = await deleteArticle(articleId);
    if (result.success) {
      const project = searchParams.get('project');
      router.push(`/articles${project ? `?project=${encodeURIComponent(project)}` : ''}`);
    }
  }

  return (
    <Button type="button" variant="destructive" onClick={handleDelete}>
      Delete article
    </Button>
  );
}
