'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createNewsArticle } from '@/services/news';
import { articleReference } from '@/services/news-reference';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Textarea } from '@neup/components/ui/textarea';

export default function WriteArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const result = await createNewsArticle({ title, author, imageUrl, content });
    if (result.success && result.id) {
      const project = searchParams.get('project');
      router.push(`/articles/${articleReference({ id: result.id, slug: title })}${project ? `?project=${encodeURIComponent(project)}` : ''}`);
      return;
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="font-headline text-3xl font-semibold">Write an article</h1><p className="text-muted-foreground">Create an article for this site.</p></div>
      <Input required placeholder="Article title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input placeholder="Author" value={author} onChange={(event) => setAuthor(event.target.value)} />
      <Input placeholder="Featured image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
      <Textarea required className="min-h-[360px]" placeholder="Write your article content..." value={content} onChange={(event) => setContent(event.target.value)} />
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Publish article'}</Button>
    </form>
  );
}
