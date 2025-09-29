
import { getSite } from '@/actions/editor/site';
import Canvas from '@/components/editor/canvas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';

const emptyFn = () => {};

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const { id } = params;
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

  return (
    <div className="bg-background text-foreground">
        {/* We use the Canvas component but disable all interactive features to create a pure preview */}
        <Canvas
            elements={elements as CanvasElementData[]}
            selectedElement={null}
            onSelectElement={emptyFn}
            updateElement={emptyFn}
            moveElement={emptyFn}
            addElement={emptyFn}
            addGeneratedElement={emptyFn}
        />
    </div>
  );
}
