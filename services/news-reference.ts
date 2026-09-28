export function slugifyArticle(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function articleReference(article: { slug?: string; id: string }): string {
  return `${slugifyArticle(article.slug || 'article')}--${article.id}`;
}

export function parseArticleReference(reference: string): { slug: string; id: string } | null {
  const separator = reference.lastIndexOf('--');
  if (separator <= 0 || separator === reference.length - 2) return null;
  return { slug: reference.slice(0, separator), id: reference.slice(separator + 2) };
}

export function formatArticlePublishedTime(value: string | null): string {
  if (!value) return 'Unpublished';
  const publishedAt = new Date(value);
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 60000));

  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min${elapsedMinutes === 1 ? '' : 's'} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;

  return publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
