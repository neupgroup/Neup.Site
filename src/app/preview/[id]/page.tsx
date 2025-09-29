
import { getSite } from '@/actions/editor/site';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { convertJsonToHtml } from '@/lib/json-to-html';

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
    const errorHtml = `
      <div style="display: flex; height: 100vh; width: 100%; align-items: center; justify-content: center; background-color: #f5f5f5; padding: 1rem;">
        <div style="border: 1px solid #fecaca; background-color: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; max-width: 24rem;">
          <h2 style="font-weight: bold;">Invalid Preview Request</h2>
          <p>No site ID was provided.</p>
        </div>
      </div>
    `;
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  const { success, elements, error } = await getSite(id);

  if (!success || !elements) {
    const errorHtml = `
      <div style="display: flex; height: 100vh; width: 100%; align-items: center; justify-content: center; background-color: #f5f5f5; padding: 1rem;">
        <div style="border: 1px solid #fecaca; background-color: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; max-width: 24rem;">
          <h2 style="font-weight: bold;">Preview Error</h2>
          <p>${error || 'Could not load the site for preview.'}</p>
        </div>
      </div>
    `;
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }

  const htmlContent = convertJsonToHtml(elements);

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}
