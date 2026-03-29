

import { collection, query, where, getDocs, limit, doc, getDoc, orderBy } from '@/lib/firestore';
import { convertJsonToHtml } from '@/lib/json-to-html';
import { getDataStore } from '@/lib/data-store';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import type { Redirect } from '@/schemas/redirect';

async function handleRedirect(slug: string[]): Promise<NextResponse | null> {
  const { firestore } = getDataStore();
  const incomingPath = `/${slug.join('/')}`;

  // Query for all redirects on the site. In a high-traffic app, this would be cached.
  // We can't easily query for a pattern match in Firestore, so we fetch all and match in memory.
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return null;

  const redirectsRef = collection(firestore, 'redirects');
  const q = query(redirectsRef, where('siteId', '==', siteId));
  const redirectsSnapshot = await getDocs(q);

  if (redirectsSnapshot.empty) {
    return null;
  }

  const redirects = redirectsSnapshot.docs.map(doc => doc.data() as Redirect);

  for (const redirect of redirects) {
    const fromPattern = redirect.from.replace(/\{\{\w+\}\}/g, '([^/]+)');
    const regex = new RegExp(`^${fromPattern}$`);
    const match = incomingPath.match(regex);

    if (match) {
      const wildcardNames = (redirect.from.match(/\{\{(\w+)\}\}/g) || []).map(p => p.slice(2, -2));
      let destination = redirect.to;

      wildcardNames.forEach((name, index) => {
        destination = destination.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), match[index + 1]);
      });

      const status = redirect.type === 'permanent' ? 301 : 302;

      // Handle absolute vs. relative 'to' URLs
      if (destination.startsWith('/')) {
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || 'http';
        const url = new URL(destination, `${protocol}://${host}`);
        return NextResponse.redirect(url, { status });
      }
      return NextResponse.redirect(destination, { status });
    }
  }

  return null;
}


async function getPageForPath(slug: string[]): Promise<{ html: string | null, theme?: { primary?: string, accent?: string } }> {
  const path = `/${slug.join('/')}`;

  const { firestore } = getDataStore();

  try {
    const pathsRef = collection(firestore, 'paths');
    const qPath = query(pathsRef, where('path', '==', path), limit(1));
    const pathSnapshot = await getDocs(qPath);

    if (pathSnapshot.empty) {
      return { html: null };
    }

    const pathData = pathSnapshot.docs[0].data();
    const pageId = pathData.pageId;
    const siteId = pathData.siteId;

    const pageRef = doc(firestore, 'pages', pageId);
    const siteRef = doc(firestore, 'sites', siteId);

    const [pageSnap, siteSnap] = await Promise.all([getDoc(pageRef), getDoc(siteRef)]);


    if (!pageSnap.exists()) {
      return { html: null };
    }

    const pageData = pageSnap.data();
    const elements = pageData.elements;

    const siteData = siteSnap.exists() ? siteSnap.data() : null;

    const html = convertJsonToHtml(elements, siteData?.theme);

    return { html, theme: siteData?.theme };

  } catch (error) {
    console.error("Error resolving path:", error);
    return { html: null };
  }
}




export default async function CatchAllPage(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;

  const { slug } = params;

  // 1. Check for redirects first
  const redirectResponse = await handleRedirect(slug);
  if (redirectResponse) {
    return redirectResponse;
  }

  // 2. If no redirect, try to render a page
  const { html: htmlContent } = await getPageForPath(slug);

  if (!htmlContent) {
    const notFoundHtml = `
      <div style="display: flex; height: 100vh; width: 100%; align-items: center; justify-content: center; background-color: #f5f5f5; padding: 1rem; font-family: sans-serif;">
        <div style="text-align: center;">
          <h1 style="font-size: 3rem; font-weight: bold;">404</h1>
          <p style="font-size: 1.25rem;">Page Not Found</p>
          <p style="color: #666;">The path you requested could not be found.</p>
        </div>
      </div>
    `;
    return new Response(notFoundHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}
