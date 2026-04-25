

import { db } from '@/lib/db';
import { convertJsonToHtml } from '@/lib/json-to-html';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import type { Redirect } from '@/schemas/redirect';

async function handleRedirect(slug: string[]): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return null;

  const incomingPath = `/${slug.join('/')}`;
  const redirects = await db.redirect.findMany({ where: { artifactId } });
  if (!redirects.length) return null;

  for (const redirect of redirects) {
    const fromPattern = redirect.from.replace(/\{\{\w+\}\}/g, '([^/]+)');
    const match = incomingPath.match(new RegExp(`^${fromPattern}$`));
    if (!match) continue;

    const wildcardNames = (redirect.from.match(/\{\{(\w+)\}\}/g) || []).map((p: string) => p.slice(2, -2));
    let destination = redirect.to;
    wildcardNames.forEach((name: string, index: number) => {
      destination = destination.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), match[index + 1]);
    });

    const status = redirect.type === 'permanent' ? 301 : 302;
    if (destination.startsWith('/')) {
      const headersList = await headers();
      const host = headersList.get('host') || 'localhost:3000';
      const protocol = headersList.get('x-forwarded-proto') || 'http';
      return NextResponse.redirect(new URL(destination, `${protocol}://${host}`), { status });
    }
    return NextResponse.redirect(destination, { status });
  }

  return null;
}

async function getPageForPath(slug: string[]): Promise<{ html: string | null, theme?: any }> {
  const path = `/${slug.join('/')}`;

  try {
    const pathRecord = await db.pagePath.findFirst({ where: { path } });
    if (!pathRecord) return { html: null };

    const [pageRecord, themeRecord] = await Promise.all([
      db.page.findUnique({ where: { id: pathRecord.pageId } }),
      db.theme.findUnique({ where: { id: pathRecord.artifactId } }),
    ]);

    if (!pageRecord) return { html: null };

    const html = convertJsonToHtml(pageRecord.elements as any, (themeRecord?.theme as any)?.theme);
    return { html, theme: (themeRecord?.theme as any) };
  } catch (error) {
    console.error('Error resolving path:', error);
    return { html: null };
  }
}

export default async function CatchAllPage(props: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await props.params;

  const redirectResponse = await handleRedirect(slug);
  if (redirectResponse) return redirectResponse;

  const { html: htmlContent } = await getPageForPath(slug);

  if (!htmlContent) {
    return new Response(`<div style="display:flex;height:100vh;width:100%;align-items:center;justify-content:center;font-family:sans-serif;"><div style="text-align:center;"><h1 style="font-size:3rem;font-weight:bold;">404</h1><p>Page Not Found</p></div></div>`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }

  return new Response(htmlContent, { headers: { 'Content-Type': 'text/html' }, status: 200 });
}
