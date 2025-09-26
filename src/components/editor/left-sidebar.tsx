import { FC, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Type, Image as ImageIcon, MousePointerClick, LayoutTemplate, Box, Container, FormInput, File, Layers, Component, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Sparkles } from 'lucide-react';
import { CanvasElementData } from '@/app/site/editor/page';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateSiteSectionAction, type GenerateSiteSectionInput } from '@/app/actions';
import { Textarea } from '../ui/textarea';
import { logErrorToFirestore } from '@/app/actions';

const ContentBlock: FC<{ icon: React.ReactNode; label: string, type: string, props?: Record<string, any> }> = ({ icon, label, type, props }) => (
  <div
    className="flex cursor-grab flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary hover:border-primary active:cursor-grabbing"
    draggable
    onDragStart={(e) => {
      const data = { type: 'sidebar-element', elementType: type, props };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
    }}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </div>
);

const getIconForType = (type: CanvasElementData['type']) => {
    switch(type) {
        case 'text': return <Type className="h-4 w-4" />;
        case 'image':
        case 'feature-image':
             return <ImageIcon className="h-4 w-4" />;
        case 'button': 
        case 'hero-cta':
            return <MousePointerClick className="h-4 w-4" />;
        case 'section': return <LayoutTemplate className="h-4 w-4" />;
        case 'div': return <Box className="h-4 w-4" />;
        case 'container': return <Container className="h-4 w-4" />;
        case 'input': return <FormInput className="h-4 w-4" />;
        case 'hero': return <Heading1 className="h-4 w-4" />;
        case 'heading': return <Heading1 className="h-4 w-4" />;
        case 'hero-subtitle': return <Heading2 className="h-4 w-4" />;
        default: return <Component className="h-4 w-4" />;
    }
}

const DropIndicator: FC<{className?: string}> = ({className}) => (
    <div className={cn("relative h-0.5 w-full bg-primary rounded-full", className)} />
)

const LayerItem: FC<{ 
    element: CanvasElementData, 
    level: number, 
    selectedElement: string | null,
    onSelectElement: (id: string) => void,
    onDrop: (draggedId: string, dropZoneId: string, parentId?: string | null) => void;
    parentId: string | null;
}> = ({ element, level, selectedElement, onSelectElement, onDrop, parentId }) => {
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json', JSON.stringify({ id: element.id, type: 'canvas-element' }));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        setIsDraggedOver(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev - 1);
        if (dragCounter === 1) {
            setIsDraggedOver(false);
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggedOver(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'canvas-element' && data.id !== element.id) {
            onDrop(data.id, element.id, parentId);
        }
        setIsDraggedOver(false);
        setDragCounter(0);
    };

    const isContainer = ['section', 'div', 'container'].includes(element.type);

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative"
        >
            {isDraggedOver && <DropIndicator className="absolute -top-px left-0" />}
            <div 
                className={cn(
                    "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-secondary",
                    { "bg-secondary": selectedElement === element.id }
                )}
                style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(element.id);
                }}
            >
                {getIconForType(element.type)}
                <span className="text-sm truncate">{element.type}</span>
            </div>
            {isContainer && element.children && (
                 <div style={{ paddingLeft: `${level * 1 + 0.5}rem` }}>
                    {element.children.map(child => (
                        <LayerItem 
                            key={child.id} 
                            element={child} 
                            level={level + 1}
                            selectedElement={selectedElement}
                            onSelectElement={onSelectElement}
                            onDrop={onDrop}
                            parentId={element.id}
                        />
                    ))}
                 </div>
            )}
        </div>
    );
};

const AiGenerator: FC<{addGeneratedElement: (element: CanvasElementData) => void}> = ({ addGeneratedElement }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                variant: 'destructive',
                title: 'Prompt is empty',
                description: 'Please describe the section you want to generate.',
            });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateSiteSectionAction({ prompt });
            if (result && result.section) {
                addGeneratedElement(result.section);
                toast({
                    title: 'Section Generated!',
                    description: 'The new section has been added to the bottom of your page.',
                });
                setPrompt('');
            } else {
                 throw new Error('AI did not return a valid section.');
            }
        } catch (error: any) {
            console.error("Error generating site section:", error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: error.message || 'An unknown error occurred while generating the section.',
            });
            logErrorToFirestore({ message: error.message, stack: error.stack });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">AI Generate</p>
            <div className="space-y-2">
                <Textarea 
                    placeholder="e.g., A two-column feature section with an image on the left and text on the right."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? (
                        'Generating...'
                    ) : (
                       <>
                         <Sparkles className="mr-2 h-4 w-4" />
                         Generate
                       </>
                    )}
                </Button>
            </div>
        </div>
    );
}


interface LeftSidebarProps {
    elements: CanvasElementData[];
    selectedElement: string | null;
    onSelectElement: (id: string | null) => void;
    moveElement: (draggedId: string, dropZoneId: string, parentId?: string) => void;
    addGeneratedElement: (element: CanvasElementData) => void;
}

const LeftSidebar: FC<LeftSidebarProps> = ({ elements, selectedElement, onSelectElement, moveElement, addGeneratedElement }) => {
  
  const handleDrop = (draggedId: string, dropZoneId: string, parentId?: string | null) => {
      moveElement(draggedId, dropZoneId, parentId || undefined);
  }

  return (
    <aside className="w-72 border-r bg-card">
      <Tabs defaultValue="add" className="flex h-full flex-col">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="layers"><Layers className="h-4 w-4"/></TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="add" className="p-4">
            <div className="space-y-4">
               <AiGenerator addGeneratedElement={addGeneratedElement} />
               <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or add manually</span>
                    </div>
                </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Layout</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<LayoutTemplate className="h-6 w-6" />} label="Section" type="section" />
                    <ContentBlock icon={<Box className="h-6 w-6" />} label="Div Block" type="div" />
                    <ContentBlock icon={<Container className="h-6 w-6" />} label="Container" type="container" />
                  </div>
              </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Typography</p>
                   <div className="grid grid-cols-2 gap-4">
                        <ContentBlock icon={<Heading1 className="h-6 w-6" />} label="Heading 1" type="heading" props={ { level: 1 } } />
                        <ContentBlock icon={<Heading2 className="h-6 w-6" />} label="Heading 2" type="heading" props={ { level: 2 } } />
                        <ContentBlock icon={<Heading3 className="h-6 w-6" />} label="Heading 3" type="heading" props={ { level: 3 } } />
                        <ContentBlock icon={<Heading4 className="h-6 w-6" />} label="Heading 4" type="heading" props={ { level: 4 } } />
                        <ContentBlock icon={<Heading5 className="h-6 w-6" />} label="Heading 5" type="heading" props={ { level: 5 } } />
                        <ContentBlock icon={<Heading6 className="h-6 w-6" />} label="Heading 6" type="heading" props={ { level: 6 } } />
                        <ContentBlock icon={<Type className="h-6 w-6" />} label="Text" type="text" />
                   </div>
              </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Basic</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<ImageIcon className="h-6 w-6" />} label="Image" type="image" />
                    <ContentBlock icon={<MousePointerClick className="h-6 w-6" />} label="Button" type="button" />
                  </div>
              </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Forms</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<FormInput className="h-6 w-6" />} label="Input" type="input" />
                  </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="layers" className="p-2">
            <div className="space-y-1">
                {elements.map(el => (
                    <LayerItem 
                        key={el.id} 
                        element={el} 
                        level={0}
                        selectedElement={selectedElement}
                        onSelectElement={(id) => onSelectElement(id)}
                        onDrop={handleDrop}
                        parentId={null}
                    />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="templates" className="p-4">
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <p>Section templates coming soon!</p>
            </div>
          </TabsContent>
          <TabsContent value="pages" className="p-4">
            <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                    <File className="mr-2 h-4 w-4" /> Home
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                    <File className="mr-2 h-4 w-4" /> About
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                    <File className="mr-2 h-4 w-4" /> Contact
                </Button>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add New Page
                </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
};

export default LeftSidebar;
