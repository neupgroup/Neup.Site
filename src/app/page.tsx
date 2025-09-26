'use client';
import type { FC } from 'react';
import { useState } from 'react';
import EditorHeader from '@/components/editor/header';
import LeftSidebar from '@/components/editor/left-sidebar';
import RightSidebar from '@/components/editor/right-sidebar';
import Canvas from '@/components/editor/canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface CanvasElementData {
  id: string;
  type: 'text' | 'image' | 'button' | 'hero' | 'hero-subtitle' | 'hero-cta' | 'feature-image';
  content?: string;
  styles: React.CSSProperties;
  props?: Record<string, any>;
}

const initialElements: CanvasElementData[] = [
    {
        id: "hero",
        type: 'hero',
        content: "Build Your Website Visually",
        styles: {
            padding: '48px 20px 20px',
            textAlign: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
        }
    },
    {
        id: "hero-subtitle",
        type: 'hero-subtitle',
        content: "Create stunning, professional websites with our intuitive drag-and-drop editor. No code required.",
        styles: {
            padding: '0 48px',
            marginTop: '-32px',
            textAlign: 'center',
            fontSize: '18px',
            color: 'hsl(var(--muted-foreground))'
        }
    },
    {
        id: "hero-cta",
        type: "hero-cta",
        content: "Get Started Now",
        styles: {
            marginTop: '32px',
            textAlign: 'center',
            paddingBottom: '48px',
        }
    },
    {
        id: "feature-image",
        type: 'feature-image',
        props: {
            src: PlaceHolderImages.find(p => p.id === 'feature-1')?.imageUrl,
            alt: PlaceHolderImages.find(p => p.id === 'feature-1')?.description,
            'data-ai-hint': PlaceHolderImages.find(p => p.id === 'feature-1')?.imageHint
        },
        styles: {
            width: '100%',
        }
    }
]


const WebsiteBuilderPage: FC = () => {
  const [elements, setElements] = useState<CanvasElementData[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('text/plain') as CanvasElementData['type'];
    if (!elementType) return;

    const newElement: CanvasElementData = {
        id: `${elementType}-${Date.now()}`,
        type: elementType,
        styles: {
            padding: '10px',
        }
    }

    if (elementType === 'text') {
        newElement.content = 'New Text';
        newElement.styles.fontSize = '16px';
        newElement.styles.textAlign = 'left';
    } else if (elementType === 'button') {
        newElement.content = 'New Button';
    } else if (elementType === 'image') {
        const placeholder = PlaceHolderImages.find(p => p.id === 'feature-2');
        newElement.props = {
            src: placeholder?.imageUrl,
            alt: placeholder?.description,
            'data-ai-hint': placeholder?.imageHint,
            width: 200,
            height: 100
        };
    }
    
    setElements(prev => [...prev, newElement]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateElement = (id: string, newStyles: React.CSSProperties, newContent?: string) => {
    setElements(prev => prev.map(el => {
        if (el.id === id) {
            const updatedElement = {...el, styles: {...el.styles, ...newStyles}};
            if (newContent !== undefined) {
                updatedElement.content = newContent;
            }
            return updatedElement;
        }
        return el;
    }));
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-background" onDrop={handleDrop} onDragOver={handleDragOver}>
          <Canvas 
            elements={elements} 
            selectedElement={selectedElement} 
            onSelectElement={setSelectedElement}
            />
        </main>
        <RightSidebar 
            selectedElementId={selectedElement} 
            elements={elements}
            updateElement={updateElement}
        />
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;
