import { Suspense } from 'react';
import type { FC } from 'react';
import Editor from '@/components/editor/editor';
import { getSite } from '@/actions/editor/site';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { CanvasElementData } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';

const initialElements: CanvasElementData[] = [
    {
        id: 'main-section',
        type: 'section',
        styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
            paddingLeft: '20px',
            paddingRight: '20px',
            minHeight: '100px',
            backgroundColor: 'white'
        },
        children: [
            {
                id: "hero",
                type: 'heading',
                content: "Build Your Website Visually",
                props: {
                    level: 1,
                },
                styles: {
                    paddingTop: '48px',
                    paddingRight: '20px',
                    paddingLeft: '20px',
                    paddingBottom: '20px',
                    textAlign: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    display: 'block',
                }
            },
            {
                id: "hero-subtitle",
                type: 'text',
                content: "Create stunning, professional websites with our intuitive drag-and-drop editor. No code required.",
                styles: {
                    paddingTop: '0px',
                    paddingRight: '48px',
                    paddingBottom: '0px',
                    paddingLeft: '48px',
                    marginTop: '-32px',
                    textAlign: 'center',
                    fontSize: '18px',
                    color: 'hsl(var(--muted-foreground))',
                    display: 'block',
                }
            },
            {
                id: "hero-cta",
                type: "button",
                content: "Get Started Now",
                styles: {
                    marginTop: '32px',
                    textAlign: 'center',
                    paddingTop: '0px',
                    paddingRight: '0px',
                    paddingBottom: '48px',
                    paddingLeft: '0px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    width: 'fit-content'
                }
            },
            {
                id: "feature-image",
                type: 'image',
                props: {
                    src: PlaceHolderImages.find(p => p.id === 'feature-1')?.imageUrl,
                    alt: PlaceHolderImages.find(p => p.id === 'feature-1')?.description,
                    'data-ai-hint': PlaceHolderImages.find(p => p.id === 'feature-1')?.imageHint
                },
                styles: {
                    display: 'block',
                }
            }
        ]
    }
];

interface WebsiteBuilderPageProps {
  searchParams: {
    mode?: 'create' | 'edit';
    id?: string;
  };
}

const EditorLoadingSkeleton = () => (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
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
  const { mode = 'create', id } = searchParams;
  let siteElements: CanvasElementData[] = initialElements;
  let siteId: string | undefined = id;

  if (mode === 'edit' && id) {
    const { success, elements } = await getSite(id);
    if (success && elements && elements.length > 0) {
      siteElements = elements;
    } else {
        // Handle case where site is not found or empty
        console.warn(`Site with id ${id} not found or is empty. Starting new editor session.`);
        siteElements = initialElements;
        siteId = undefined; // Start as a new site
    }
  }

  return (
    <Suspense fallback={<EditorLoadingSkeleton />}>
        <Editor initialElements={siteElements} siteId={siteId} />
    </Suspense>
  );
};

export default WebsiteBuilderPage;