
import { Suspense } from 'react';
import type { FC } from 'react';
import Editor from '@/components/editor/editor';
import { getPage } from '@/actions/editor/pages';
import type { CanvasElementData } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';

const initialElements: CanvasElementData[] = [];

interface WebsiteBuilderPageProps {
  searchParams: {
    id?: string;
  };
}

const EditorLoadingSkeleton = () => (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
            </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-72 border-r bg-card p-4">
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto bg-background p-10">
                <Skeleton className="h-full w-full" />
            </main>
            <aside className="w-80 border-l bg-card p-4">
                 <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </aside>
        </div>
    </div>
)


const WebsiteBuilderPage: FC<WebsiteBuilderPageProps> = async ({ searchParams }) => {
  const { id } = searchParams;
  let pageElements: CanvasElementData[] = initialElements;
  let pageId: string | undefined = id;

  if (id) {
    const { success, page } = await getPage(id);
    if (success && page && page.elements?.length > 0) {
      pageElements = page.elements;
    } else {
        // Handle case where page is not found or empty
        console.warn(`Page with id ${id} not found or is empty. Starting new editor session.`);
        pageElements = initialElements;
        pageId = undefined; // Start as a new page
    }
  }

  return (
    <Suspense fallback={<EditorLoadingSkeleton />}>
        <Editor initialElements={pageElements} pageId={pageId} />
    </Suspense>
  );
};

export default WebsiteBuilderPage;
