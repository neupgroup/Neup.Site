
'use client';
import { FC, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CanvasElementData } from '@/app/page';

interface CodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElementData[];
}

const globalCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

const generateHtmlBody = (elements: CanvasElementData[]): string => {
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
        html += '\n' + generateHtmlBody(element.children) + '\n';
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

const generateFullHtml = (elements: CanvasElementData[]) => {
    const bodyContent = generateHtmlBody(elements);
    const dynamicCss = generateCss(elements);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Page</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
        /* Base styles from globals.css */
        body {
            font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
           font-family: 'Space Grotesk', sans-serif;
        }

        /* Dynamically generated styles */
        ${dynamicCss}
    </style>
</head>
<body class="font-body antialiased">
    ${bodyContent}
</body>
</html>
    `.trim();
}


const CodeViewer: FC<CodeViewerProps> = ({ isOpen, onClose, elements }) => {
  const { toast } = useToast();
  const fullHtmlCode = useMemo(() => generateFullHtml(elements), [elements]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullHtmlCode);
    toast({
      title: 'Copied to clipboard!',
      description: `The full HTML code has been copied.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-4/5 flex flex-col">
        <DialogHeader>
          <DialogTitle>Generated HTML Code</DialogTitle>
          <DialogDescription>
            Here is the complete, self-contained HTML for the page you've built.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative">
            <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={copyToClipboard}
            >
            Copy
            </Button>
            <pre className="h-full overflow-auto rounded-md bg-muted p-4">
                <code className="text-sm">{fullHtmlCode}</code>
            </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeViewer;
