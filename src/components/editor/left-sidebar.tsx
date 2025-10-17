'use client';

import { FC, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Type, Image as ImageIcon, MousePointerClick, LayoutTemplate, Box, Container, FormInput, File, Layers, Component, Heading1, Video, List, Pilcrow, MessageSquare, Square, CaseSensitive, Code, Search, ArrowUp, ArrowDown, Copy, Trash2, CornerUpLeft } from 'lucide-react';
import type { CanvasElementData } from '@/schemas/canvas';
import type { Template } from '@/schemas/template';
import { cn } from '@/lib/utils';
import { logErrorToFirestore } from '@/lib/logging';
import Link from 'next/link';
import { getTemplates } from '@/actions/editor/templates';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

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
        case 'image': return <ImageIcon className="h-4 w-4" />;
        case 'button': return <MousePointerClick className="h-4 w-4" />;
        case 'section': return <LayoutTemplate className="h-4 w-4" />;
        case 'div': return <Box className="h-4 w-4" />;
        case 'container': return <Container className="h-4 w-4" />;
        case 'input': return <FormInput className="h-4 w-4" />;
        case 'video': return <Video className="h-4 w-4" />;
        case 'list': return <List className="h-4 w-4" />;
        case 'list-item': return <Pilcrow className="h-4 w-4" />;
        case 'form': return <MessageSquare className="h-4 w-4" />;
        case 'label': return <CaseSensitive className="h-4 w-4" />;
        case 'textarea': return <Square className="h-4 w-4" />;
        case 'html': return <Code className="h-4 w-4" />;
        default: return <Component className="h-4 w-4" />;
    }
}

const DropIndicator: FC<{className?: string}> = ({className}) => (
    <div className={cn("relative h-0.5 w-full bg-primary rounded-full", className)} />
)

const LayerItem: FC<{ 
    element: CanvasElementData, 
    level: number, 
    selectedElementId: string | null,
    onSelectElement: (id: string | null) => void,
    onDrop: (draggedId: string, dropZoneId: string | null, parentId?: string | null) => void;
    parentId: string | null;
    onMoveElement: (direction: 'up' | 'down') => void;
    onCloneElement: () => void;
    onDeleteElement: () => void;
    onSelectParent: () => void;
    hasParent: boolean;
}> = ({ element, level, selectedElementId, onSelectElement, onDrop, parentId, onMoveElement, onCloneElement, onDeleteElement, onSelectParent, hasParent }) => {
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
            if (isContainer) {
                onDrop(data.id, null, element.id);
            } else {
                onDrop(data.id, element.id, parentId);
            }
        }
        setIsDraggedOver(false);
        setDragCounter(0);
    };

    const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(element.type);
    const isSelected = selectedElementId === element.id;

    return (
        <div>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative group"
            >
                {isDraggedOver && !isContainer && <DropIndicator className="absolute -top-px left-0" />}
                <div 
                    className={cn(
                        "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-secondary",
                        { "bg-secondary ring-1 ring-primary": isSelected },
                        { "ring-1 ring-primary": isDraggedOver && isContainer }
                    )}
                    style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(element.id);
                    }}
                >
                    {getIconForType(element.type)}
                    <span className="text-sm truncate flex-1">{element.id}</span>

                    {isSelected && (
                        <div className="flex items-center gap-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSelectParent(); }} disabled={!hasParent} title="Select Parent">
                                <CornerUpLeft className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveElement('up'); }} title="Move Up">
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveElement('down'); }} title="Move Down">
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onCloneElement(); }} title="Clone Element">
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteElement(); }} title="Delete Element">
                                <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {isContainer && element.children && (
                 <div className="relative">
                    {element.children.map((child: CanvasElementData) => (
                        <LayerItem 
                            key={child.id} 
                            element={child} 
                            level={level + 1}
                            selectedElementId={selectedElementId}
                            onSelectElement={onSelectElement}
                            onDrop={onDrop}
                            parentId={element.id}
                            onMoveElement={onMoveElement}
                            onCloneElement={onCloneElement}
                            onDeleteElement={onDeleteElement}
                            onSelectParent={onSelectParent}
                            hasParent={true}
                        />
                    ))}
                 </div>
            )}
        </div>
    );
};

const TemplateLibrary = ({addGeneratedElement}: {addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTemplates();
        if (result.success && result.templates) {
          setTemplates(result.templates);
        } else {
          setError(result.error || 'Failed to fetch templates.');
        }
      } catch (e: any) {
        setError('An unexpected error occurred.');
        logErrorToFirestore({ message: e.message, stack: e.stack });
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleDragStart = (e: React.DragEvent, template: Template) => {
    const jsonContent = template.content?.json;
    if(jsonContent && jsonContent.length > 0) {
      const data = {
        type: 'template-element',
        element: jsonContent[0],
      };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
    } else {
        e.preventDefault();
        toast({ variant: 'destructive', title: 'Empty Template', description: 'This template has no JSON content to add.' });
    }
  };
  
  if (loading) {
    return <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  }

  if (error) {
    return <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
    </Alert>
  }
  
  return (
    <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
             <p className="text-sm font-medium text-muted-foreground">Templates</p>
        </div>
      {templates.length > 0 ? (
        templates.map((template: Template) => (
          <div
            key={template.id}
            className="flex items-center gap-2 cursor-grab rounded-lg border bg-card p-2 transition-colors hover:bg-secondary hover:border-primary active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium line-clamp-2">{template.name}</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center p-4">No templates found.</p>
      )}
    </div>
  );
};


interface LeftSidebarProps {
    elements: CanvasElementData[];
    selectedElement: string | null;
    onSelectElement: (id: string | null) => void;
    moveElement: (draggedId: string, dropZoneId: string | null, parentId?: string) => void;
    addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void;
    onMoveElement: (direction: 'up' | 'down') => void;
    onCloneElement: () => void;
    onDeleteElement: () => void;
    onSelectParent: () => void;
}

const LeftSidebar: FC<LeftSidebarProps> = ({ elements, selectedElement, onSelectElement, moveElement, addGeneratedElement, onMoveElement, onCloneElement, onDeleteElement, onSelectParent }) => {
  
  const handleDrop = (draggedId: string, dropZoneId: string | null, parentId?: string | null) => {
      moveElement(draggedId, dropZoneId, parentId || undefined);
  }

  return (
    <aside className="w-72 border-r bg-card">
      <Tabs defaultValue="add" className="flex h-full flex-col">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="layers"><Layers className="h-4 w-4"/></TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="add" className="p-4">
            <div className="space-y-4">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search elements..." className="pl-8" />
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
                        <ContentBlock icon={<Type className="h-6 w-6" />} label="Text" type="text" />
                   </div>
              </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Lists</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<List className="h-6 w-6" />} label="List" type="list" />
                    <ContentBlock icon={<Pilcrow className="h-6 w-6" />} label="List Item" type="list-item" />
                  </div>
              </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Basic</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<ImageIcon className="h-6 w-6" />} label="Image" type="image" />
                    <ContentBlock icon={<MousePointerClick className="h-6 w-6" />} label="Button" type="button" />
                    <ContentBlock icon={<Video className="h-6 w-6" />} label="Video" type="video" />
                  </div>
              </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Forms</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ContentBlock icon={<MessageSquare className="h-6 w-6" />} label="Form" type="form" />
                    <ContentBlock icon={<FormInput className="h-6 w-6" />} label="Input" type="input" />
                    <ContentBlock icon={<Square className="h-6 w-6" />} label="Textarea" type="textarea" />
                    <ContentBlock icon={<CaseSensitive className="h-6 w-6" />} label="Label" type="label" />
                  </div>
              </div>
              <div className="pt-4">
                  <TemplateLibrary addGeneratedElement={addGeneratedElement} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="layers" className="p-2">
            <div className="space-y-1">
                {elements.map((el: CanvasElementData) => (
                    <LayerItem 
                        key={el.id} 
                        element={el} 
                        level={0}
                        selectedElementId={selectedElement}
                        onSelectElement={onSelectElement}
                        onDrop={handleDrop}
                        parentId={null}
                        onMoveElement={onMoveElement}
                        onCloneElement={onCloneElement}
                        onDeleteElement={onDeleteElement}
                        onSelectParent={onSelectParent}
                        hasParent={false}
                    />
                ))}
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