
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { convertJsonToHtml } from '@/lib/json-to-html';

async function getPageForPath(slug: string[]): Promise<string | null> {
    const path = `/${slug.join('/')}`;
    
    try {
        // 1. Find the path mapping
        const pathsRef = collection(db, 'paths');
        const q = query(pathsRef, where('path', '==', path), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null; // No path mapping found
        }
        
        const pathData = querySnapshot.docs[0].data();
        const pageId = pathData.pageId;

        // 2. Fetch the corresponding page content from the 'pages' collection
        const pageRef = doc(db, 'pages', pageId);
        const pageSnap = await getDoc(pageRef);

        if (!pageSnap.exists()) {
            return null; // Page document not found
        }

        const pageData = pageSnap.data();
        const elements = pageData.elements;

        // 3. Convert JSON to HTML
        return convertJsonToHtml(elements);

    } catch (error) {
        console.error("Error resolving path:", error);
        return null;
    }
}


export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  
  const htmlContent = await getPageForPath(params.slug);

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
