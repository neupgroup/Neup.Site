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
