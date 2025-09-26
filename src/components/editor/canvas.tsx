import type { FC } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CanvasProps {
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
}

const CanvasElement: FC<{
  id: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ id, selectedElement, onSelectElement, children, className }) => {
  const isSelected = selectedElement === id;
  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-primary/50',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement(id);
      }}
    >
      {children}
    </div>
  );
};

const Canvas: FC<CanvasProps> = ({ selectedElement, onSelectElement }) => {
  const featureImage = PlaceHolderImages.find(p => p.id === 'feature-1');

  return (
    <div className="mx-auto h-full w-full max-w-screen-xl p-4 md:p-8" onClick={() => onSelectElement(null)}>
      <div className="rounded-lg bg-card shadow-lg">
        <CanvasElement id="hero" selectedElement={selectedElement} onSelectElement={onSelectElement} className="p-12 md:p-20 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-6xl">Build Your Website Visually</h1>
        </CanvasElement>
        <CanvasElement id="hero-subtitle" selectedElement={selectedElement} onSelectElement={onSelectElement} className="px-12 md:px-20 -mt-8 text-center">
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Create stunning, professional websites with our intuitive drag-and-drop editor. No code required.
            </p>
        </CanvasElement>
        <CanvasElement id="hero-cta" selectedElement={selectedElement} onSelectElement={onSelectElement} className="mt-8 text-center pb-12 md:pb-20">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">Get Started Now</Button>
        </CanvasElement>

        {featureImage && (
          <CanvasElement id="feature-image" selectedElement={selectedElement} onSelectElement={onSelectElement}>
            <Image
              src={featureImage.imageUrl}
              alt={featureImage.description}
              data-ai-hint={featureImage.imageHint}
              width={1200}
              height={600}
              className="aspect-[2/1] w-full object-cover"
            />
          </CanvasElement>
        )}
      </div>
    </div>
  );
};

export default Canvas;
