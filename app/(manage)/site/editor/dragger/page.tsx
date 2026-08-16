import { redirect } from 'next/navigation';

/*
::neup.documentation::legacy-site-editor-dragger-route

::public

Redirects the legacy `/site/editor/dragger` URL to the current drag-and-drop
editor route at `/editor/dragger` while preserving the page ID query string.

::public end
::end
*/

interface LegacyDraggerRedirectPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function LegacyDraggerRedirectPage({
  searchParams,
}: LegacyDraggerRedirectPageProps) {
  const { id } = await searchParams;
  const query = id ? `?id=${encodeURIComponent(id)}` : '';

  redirect(`/editor/dragger${query}`);
}
