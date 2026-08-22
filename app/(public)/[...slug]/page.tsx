import { prisma as db } from '@/core/database/prisma';
import { convertJsonToHtml } from '@/inapp/helpers/json-to-html';
import { cookies, headers } from 'next/headers';
import { notFound, permanentRedirect, redirect } from 'next/navigation';

async function resolveRedirect(slug: string[]): Promise<{ destination: string; permanent: boolean } | null> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return null;

  const incomingPath = `/${slug.join('/')}`;
  const redirects = await db.redirect.findMany({ where: { assetId } });
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
      return {
        destination: new URL(destination, `${protocol}://${host}`).toString(),
        permanent: status === 301,
      };
    }
    return { destination, permanent: status === 301 };
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
      db.theme.findUnique({ where: { id: pathRecord.assetId } }),
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

  const redirectTarget = await resolveRedirect(slug);
  if (redirectTarget) {
    if (redirectTarget.permanent) {
      permanentRedirect(redirectTarget.destination);
    }
    redirect(redirectTarget.destination);
  }

  const { html: htmlContent } = await getPageForPath(slug);

  if (!htmlContent) {
    notFound();
  }

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
