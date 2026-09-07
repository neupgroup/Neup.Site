
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';
import { Code, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
    <code className="font-mono">{children}</code>
  </pre>
);

export default function TemplatesGuidePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
       <LinkButton variant="plain" className="pl-0" href="/root/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </LinkButton>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-6 w-6" />
            Template Creation Guide
          </CardTitle>
          <CardDescription>
            Learn how to create powerful and reusable templates for your sites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structure" className="w-full">
            <TabsList>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="data">Data Binding</TabsTrigger>
              <TabsTrigger value="types">Template Types</TabsTrigger>
            </TabsList>
            <TabsContent value="structure" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Basic Template Structure</h3>
              <p>
                Every template is defined by a JSON object that describes its content. The content field has two main parts: `json` for the visual editor and `react` for the codebase.
              </p>
              <CodeBlock>
{`{
  "name": "My Hero Section",
  "description": "A hero section with a title and a button.",
  "type": "section",
  "status": "published",
  "usableOn": ["json", "react"],
  "content": {
    "json": [ /* Array of CanvasElementData objects */ ],
    "react": "export default function MyComponent() { ... }"
  }
}`}
              </CodeBlock>
               <p>
                The `content.json` field holds an array of `CanvasElementData` objects, which is what the visual editor uses. Each object in this array represents an element on the canvas.
              </p>
            </TabsContent>

            <TabsContent value="data" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Working with Dynamic Data</h3>
              <p>
                To make your templates dynamic, you can use placeholders for data that will be supplied later. The system uses a simple double-curly-brace syntax: <code>{'{{ }}'}</code>.
              </p>
              <p>
                When a page is connected to a data source that returns an array of items, you can use `item` to access the properties of each individual item in that array.
              </p>
              <CodeBlock>
{`{
  "id": "product-title",
  "type": "heading",
  "properties": {
    "text": "{{item.name}}"
  }
}`}
              </CodeBlock>
               <p>
                For an image source, you would do the same:
              </p>
               <CodeBlock>
{`{
  "id": "product-image",
  "type": "image",
  "properties": {
    "src": "{{item.imageUrl}}",
    "alt": "{{item.name}}"
  }
}`}
              </CodeBlock>
              <p>
                The visual editor allows you to connect a page to a data source. When the page is rendered, the `items` from that source will be looped over, and the placeholders in your template will be replaced with the actual data for each item.
              </p>
            </TabsContent>
            
            <TabsContent value="types" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Template Types</h3>

              <div className="space-y-2 pt-2">
                <h4 className="font-semibold">Section Templates</h4>
                <p>
                  These are the most common type. They represent a single, repeatable block on a page, like a product card, a hero banner, or a testimonial. The `json` content should be an array containing a single root element (usually a `section` or `div`).
                </p>
                 <CodeBlock>
{`// content.json for a Section Template
[
  {
    "id": "my-section-root",
    "type": "section",
    "children": [
      // ... all other elements for the section go here
    ]
  }
]`}
                 </CodeBlock>
              </div>

               <div className="space-y-2 pt-4">
                <h4 className="font-semibold">Page Templates</h4>
                <p>
                  A page template defines the entire structure of a page. Its `json` content is an array of multiple top-level `section` elements.
                </p>
                 <CodeBlock>
{`// content.json for a Page Template
[
  { "id": "header-section", "type": "section", ... },
  { "id": "hero-section", "type": "section", ... },
  { "id": "footer-section", "type": "section", ... }
]`}
                 </CodeBlock>
              </div>

               <div className="space-y-2 pt-4">
                <h4 className="font-semibold">Element Templates</h4>
                <p>
                  These are templates for smaller, individual elements like a specially styled button or a complex input field. The `json` content should be an array containing a single root element of any type.
                </p>
                 <CodeBlock>
{`// content.json for an Element Template (e.g., a custom button)
[
  {
    "id": "my-custom-button",
    "type": "button",
    "properties": {
      "text": "Click Me!",
      "backgroundColor": "hsl(var(--accent))",
      "color": "hsl(var(--accent-foreground))"
    }
  }
]`}
                 </CodeBlock>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
