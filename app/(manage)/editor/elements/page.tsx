import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Box,
  CaseSensitive,
  Code,
  ChevronRight,
  Component,
  Container,
  FormInput,
  Image as ImageIcon,
  LayoutTemplate,
  List,
  MessageSquare,
  MousePointerClick,
  Pilcrow,
  Square,
  Type,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { elementDefinitions } from '@/components/elements';
import type { CanvasElementData } from '@/services/canvas/type';

/*
::neup.documentation::editor-elements-page

::public

Lists the available editor element types on the `/editor/elements` route
inside the manage dashboard layout.

::public end
::end
*/

export const metadata: Metadata = {
  title: 'Editor Elements',
};

type ElementType = CanvasElementData['type'];

const elementLabels: Record<ElementType, string> = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  section: 'Section',
  div: 'Div',
  container: 'Container',
  input: 'Input',
  video: 'Video',
  list: 'List',
  'list-item': 'List Item',
  form: 'Form',
  label: 'Label',
  textarea: 'Textarea',
  html: 'HTML',
};

const elementDescriptions: Record<ElementType, string> = {
  text: 'Add paragraphs and inline copy blocks.',
  image: 'Display responsive images inside your layout.',
  button: 'Add clickable actions and calls to action.',
  section: 'Create large layout regions for page structure.',
  div: 'Use a flexible wrapper for custom groupings.',
  container: 'Group content with layout and spacing controls.',
  input: 'Collect single-line input from visitors.',
  video: 'Embed hosted or uploaded video content.',
  list: 'Render ordered or unordered item collections.',
  'list-item': 'Define an individual row within a list.',
  form: 'Group fields into a submit-ready form block.',
  label: 'Add accessible labels for form controls.',
  textarea: 'Collect longer multi-line text input.',
  html: 'Insert custom HTML when needed.',
};

const getIconForType = (type: ElementType) => {
  switch (type) {
    case 'text':
      return <Type className="h-5 w-5" />;
    case 'image':
      return <ImageIcon className="h-5 w-5" />;
    case 'button':
      return <MousePointerClick className="h-5 w-5" />;
    case 'section':
      return <LayoutTemplate className="h-5 w-5" />;
    case 'div':
      return <Box className="h-5 w-5" />;
    case 'container':
      return <Container className="h-5 w-5" />;
    case 'input':
      return <FormInput className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    case 'list':
      return <List className="h-5 w-5" />;
    case 'list-item':
      return <Pilcrow className="h-5 w-5" />;
    case 'form':
      return <MessageSquare className="h-5 w-5" />;
    case 'label':
      return <CaseSensitive className="h-5 w-5" />;
    case 'textarea':
      return <Square className="h-5 w-5" />;
    case 'html':
      return <Code className="h-5 w-5" />;
    default:
      return <Component className="h-5 w-5" />;
  }
};

const elementTypes = Object.keys(elementDefinitions) as ElementType[];

export default function EditorElementsPage() {
  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Elements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse the building blocks available in the visual editor.</p>
      </header>
      <div className="space-y-0">
        <Link
          href="/site/pages"
          className={[
            'block border p-4 transition-colors hover:bg-muted/90',
            elementTypes.length === 0 ? 'rounded-md' : 'rounded-t-md border-b-0',
          ].join(' ')}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <LayoutTemplate className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Open Pages</h2>
                <p className="text-sm text-muted-foreground">Jump back to pages to place these elements into your layouts.</p>
              </div>
            </div>
          </div>
        </Link>
        {elementTypes.map((type, index) => {
          const isLast = index === elementTypes.length - 1;

          return (
            <div
              key={type}
              className={[
                'border p-4',
                'rounded-t-none',
                isLast ? 'rounded-b-md' : 'rounded-b-none border-b-0',
              ].join(' ')}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    {getIconForType(type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold">{elementLabels[type]}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono">{type}</Badge>
                      <span className="text-xs text-muted-foreground">{elementDescriptions[type]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 self-start sm:self-start">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
