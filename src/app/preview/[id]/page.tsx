
import { getSite } from '@/actions/editor/site';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { convertJsonToHtml } from '@/lib/json-to-html';

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Preview Request</AlertTitle>
                <AlertDescription>No site ID was provided.</AlertDescription>
            </Alert>
        </div>
    );
  }

  const { success, elements, error } = await getSite(id);

  if (!success || !elements) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview Error</AlertTitle>
          <AlertDescription>
            {error || 'Could not load the site for preview.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const htmlContent = convertJsonToHtml(elements);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
