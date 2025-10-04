
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { convertJsonToHtml } from '@/lib/json-to-html';
import { adminDb } from '@/lib/firebase-admin';

async function getPageForPath(slug: string[]): Promise<{html: string | null, theme?: {primary?: string, accent?: string}}> {
    const path = `/${slug.join('/')}`;
    
    try {
        const pathsRef = collection(adminDb, 'paths');
        const qPath = query(pathsRef, where('path', '==', path), limit(1));
        const pathSnapshot = await getDocs(qPath);

        if (pathSnapshot.empty) {
            return { html: null };
        }
        
        const pathData = pathSnapshot.docs[0].data();
        const pageId = pathData.pageId;
        const siteId = pathData.siteId;

        const pageRef = doc(adminDb, 'pages', pageId);
        const siteRef = doc(adminDb, 'sites', siteId);

        const [pageSnap, siteSnap] = await Promise.all([getDoc(pageRef), getDoc(siteRef)]);


        if (!pageSnap.exists()) {
            return { html: null }; // Page document not found
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


export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  
  const { html: htmlContent } = await getPageForPath(params.slug);

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
