
'use client';
import { FC, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CanvasElementData } from '@/app/page';

interface CodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElementData[];
}

const generateHtml = (elements: CanvasElementData[]): string => {
  const formatAttributes = (props: Record<string, any>): string => {
    return Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  };

  const getTag = (element: CanvasElementData): string => {
    switch (element.type) {
      case 'heading': return `h${(element.props?.level || 1)}`;
      case 'text':
      case 'hero-subtitle':
         return 'p';
      case 'image':
      case 'feature-image':
        return 'img';
      case 'button':
      case 'hero-cta':
        return 'button';
      case 'section': return 'section';
      case 'container': 
      case 'div': return 'div';
      case 'input': return 'input';
      default: return 'div';
    }
  }

  let html = '';
  for (const element of elements) {
    const tag = getTag(element);
    const isSelfClosing = ['img', 'input'].includes(tag);
    
    let attributes = `class="${element.id}"`;
    if (element.props) {
      attributes += ` ${formatAttributes(element.props)}`;
    }
    if(isSelfClosing && tag === 'input') {
       if (element.props?.placeholder) {
          attributes += ` placeholder="${element.props.placeholder}"`;
       }
    }

    if (isSelfClosing) {
      html += `<${tag} ${attributes} />\n`;
    } else {
      html += `<${tag} ${attributes}>`;
      if (element.content) {
        html += element.content;
      }
      if (element.children) {
        html += '\n' + generateHtml(element.children) + '\n';
      }
      html += `</${tag}>\n`;
    }
  }
  return html;
};

const generateCss = (elements: CanvasElementData[]): string => {
  const toKebabCase = (str: string) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  
  let css = '';
  const traverse = (els: CanvasElementData[]) => {
      for (const element of els) {
          css += `.${element.id} {\n`;
          for (const [key, value] of Object.entries(element.styles)) {
              css += `  ${toKebabCase(key)}: ${value};\n`;
          }
          if (element.customCss) {
              css += `  ${element.customCss}\n`
          }
          css += '}\n\n';
          if (element.children) {
              traverse(element.children);
          }
      }
  }
  traverse(elements);
  return css;
};


const CodeViewer: FC<CodeViewerProps> = ({ isOpen, onClose, elements }) => {
  const { toast } = useToast();
  const htmlCode = useMemo(() => generateHtml(elements), [elements]);
  const cssCode = useMemo(() => generateCss(elements), [elements]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: `${type} code has been copied.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-4/5 flex flex-col">
        <DialogHeader>
          <DialogTitle>Generated Code</DialogTitle>
          <DialogDescription>
            Here is the HTML and CSS for the page you've built.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="html" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="flex-1 overflow-hidden relative">
             <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={() => copyToClipboard(htmlCode, 'HTML')}
            >
              Copy
            </Button>
            <pre className="h-full overflow-auto rounded-md bg-muted p-4">
              <code className="text-sm">{htmlCode}</code>
            </pre>
          </TabsContent>
          <TabsContent value="css" className="flex-1 overflow-hidden relative">
             <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={() => copyToClipboard(cssCode, 'CSS')}
            >
              Copy
            </Button>
            <pre className="h-full overflow-auto rounded-md bg-muted p-4">
              <code className="text-sm">{cssCode}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CodeViewer;
