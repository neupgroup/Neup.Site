import { FC, useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Blend, AlignCenter, ArrowLeftRight, StretchHorizontal, Trash2 } from 'lucide-react';
import AiAssistant from '@/components/editor/ai-assistant';
import { CanvasElementData } from '@/app/page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string) => void;
  deleteElement: (id: string) => void;
}

const RightSidebar: FC<RightSidebarProps> = ({ selectedElementId, elements, updateElement, deleteElement }) => {
  
  const findElementRecursive = (id: string, els: CanvasElementData[]): CanvasElementData | undefined => {
    for (const el of els) {
      if (el.id === id) {
        return el;
      }
      if (el.children) {
        const found = findElementRecursive(id, el.children);
        if (found) {
          return found;
        }
      }
    }
  };
  
  const selectedElement = selectedElementId ? findElementRecursive(selectedElementId, elements) : undefined;

  const [styles, setStyles] = useState<React.CSSProperties>({});
  const [props, setProps] = useState<Record<string, any>>({});
  const [content, setContent] = useState<string | undefined>(undefined);
  const colorInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (selectedElement) {
        setStyles(selectedElement.styles);
        setProps(selectedElement.props || {});
        setContent(selectedElement.content)
    }
  }, [selectedElement]);

  const handleStyleChange = (property: keyof React.CSSProperties, value: string) => {
      const newStyles = {...styles, [property]: value};
      if (property.toLowerCase().includes('padding')) {
        delete newStyles.padding;
      }
      if (property.toLowerCase().includes('margin')) {
        delete newStyles.margin;
      }
      setStyles(newStyles);
      if (selectedElementId) {
          updateElement(selectedElementId, newStyles);
      }
  }

  const handlePropChange = (property: string, value: any) => {
    const newProps = {...props, [property]: value};
    setProps(newProps);
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, newProps);
    }
  }
  
  const handleContentChange = (value: string) => {
    setContent(value);
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, undefined, value);
    }
  }

  const showFor = (types: (CanvasElementData['type'] | 'component')[]) => {
      if (!selectedElement) return false;
      if (types.includes('component')) {
          return selectedElement.type.includes('hero') || selectedElement.type.includes('feature');
      }
      return types.includes(selectedElement.type);
  }


  return (
    <aside className="w-80 border-l bg-card">
      <Tabs defaultValue="style" className="flex h-full flex-col">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
          <TabsTrigger value="style">
            <Palette className="mr-2 h-4 w-4" />
            Style
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="style" className="p-0">
            {selectedElement ? (
              <Accordion type="multiple" defaultValue={['element-id', 'content', 'layout', 'position', 'typography', 'color', 'spacing', 'image', 'attributes']} className="w-full">
                 <AccordionItem value="element-id">
                  <AccordionTrigger className="px-4 text-sm font-medium">Element</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground break-words">{selectedElement.id}</p>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteElement(selectedElement.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                 {showFor(['text', 'button', 'hero', 'hero-subtitle', 'hero-cta']) && (
                    <AccordionItem value="content">
                        <AccordionTrigger className="px-4 text-sm font-medium">Content</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-2">
                            <Label>Text</Label>
                            <Input value={content || ''} onChange={e => handleContentChange(e.target.value)} />
                        </AccordionContent>
                    </AccordionItem>
                )}

                {showFor(['input']) && (
                    <AccordionItem value="attributes">
                        <AccordionTrigger className="px-4 text-sm font-medium">Attributes</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Placeholder</Label>
                                <Input value={props.placeholder || ''} onChange={e => handlePropChange('placeholder', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}


                <AccordionItem value="layout">
                  <AccordionTrigger className="px-4 text-sm font-medium">Layout</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                     <div className="space-y-2">
                        <Label>Display</Label>
                        <Select value={styles.display || ''} onValueChange={value => handleStyleChange('display', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select display type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="inline-block">Inline Block</SelectItem>
                            <SelectItem value="inline">Inline</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="inline-flex">Inline Flex</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Alignment</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', '0'); handleStyleChange('marginRight', 'auto');}} title="Align Left">
                                <ArrowLeftRight className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', 'auto'); handleStyleChange('marginRight', 'auto');}} title="Align Center">
                                <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', 'auto'); handleStyleChange('marginRight', '0');}} title="Align Right">
                                <ArrowLeftRight className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Width</Label>
                        <div className="flex items-center gap-2">
                           <Input value={styles.width as string || ''} onChange={e => handleStyleChange('width', e.target.value)} placeholder="auto" />
                           <Button variant="outline" size="icon" onClick={() => handleStyleChange('width', '100%')} title="Full Width">
                               <StretchHorizontal className="h-4 w-4" />
                           </Button>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="position">
                  <AccordionTrigger className="px-4 text-sm font-medium">Positioning</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                     <div className="space-y-2">
                        <Label>Position</Label>
                        <Select value={styles.position || ''} onValueChange={value => handleStyleChange('position', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Static</SelectItem>
                            <SelectItem value="relative">Relative</SelectItem>
                            <SelectItem value="absolute">Absolute</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="sticky">Sticky</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>

                    {styles.position && styles.position !== 'static' && (
                        <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Top</Label>
                                <Input value={styles.top as string || ''} onChange={e => handleStyleChange('top', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Right</Label>
                                <Input value={styles.right as string || ''} onChange={e => handleStyleChange('right', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Bottom</Label>
                                <Input value={styles.bottom as string || ''} onChange={e => handleStyleChange('bottom', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Left</Label>
                                <Input value={styles.left as string || ''} onChange={e => handleStyleChange('left', e.target.value)} placeholder="auto" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Z-Index</Label>
                             <Input type="number" value={styles.zIndex || ''} onChange={e => handleStyleChange('zIndex', e.target.value)} placeholder="auto" />
                        </div>
                        </>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {(showFor(['text', 'button', 'hero', 'hero-subtitle'])) && (
                <AccordionItem value="typography">
                  <AccordionTrigger className="px-4 text-sm font-medium">Typography</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Input value={styles.fontSize || ''} onChange={e => handleStyleChange('fontSize', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <Select value={styles.fontWeight as string || ''} onValueChange={value => handleStyleChange('fontWeight', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="300">Light</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semi-bold</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Align</Label>
                      <Select value={styles.textAlign as string || ''} onValueChange={value => handleStyleChange('textAlign', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {(showFor(['text', 'hero', 'hero-subtitle'])) && (
                 <AccordionItem value="color">
                    <AccordionTrigger className="px-4 text-sm font-medium">Color</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-2">
                        <div className="flex items-center gap-2">
                           <Input value={styles.color || ''} onChange={e => handleStyleChange('color', e.target.value)} className="flex-1" placeholder="e.g. #FFFFFF or hsl(var(--...))"/>
                           <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                              <Blend className="h-4 w-4" />
                              <input
                                ref={colorInputRef}
                                type="color"
                                value={typeof styles.color === 'string' ? styles.color : '#000000'}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="absolute h-0 w-0 opacity-0"
                                />
                           </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                )}

                <AccordionItem value="spacing">
                    <AccordionTrigger className="px-4 text-sm font-medium">Spacing</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Padding</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={(styles.paddingTop as string) || ''} onChange={e => handleStyleChange('paddingTop', e.target.value)} placeholder="Top" />
                            <Input value={(styles.paddingRight as string) || ''} onChange={e => handleStyleChange('paddingRight', e.target.value)} placeholder="Right" />
                            <Input value={(styles.paddingBottom as string) || ''} onChange={e => handleStyleChange('paddingBottom', e.target.value)} placeholder="Bottom" />
                            <Input value={(styles.paddingLeft as string) || ''} onChange={e => handleStyleChange('paddingLeft', e.target.value)} placeholder="Left" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Margin</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={(styles.marginTop as string) || ''} onChange={e => handleStyleChange('marginTop', e.target.value)} placeholder="Top" />
                            <Input value={(styles.marginRight as string) || ''} onChange={e => handleStyleChange('marginRight', e.target.value)} placeholder="Right" />
                            <Input value={(styles.marginBottom as string) || ''} onChange={e => handleStyleChange('marginBottom', e.target.value)} placeholder="Bottom" />
                            <Input value={(styles.marginLeft as string) || ''} onChange={e => handleStyleChange('marginLeft', e.target.value)} placeholder="Left" />
                          </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {showFor(['image', 'feature-image']) && (
                   <AccordionItem value="image">
                    <AccordionTrigger className="px-4 text-sm font-medium">Image</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Source URL</Label>
                          <Input value={props.src || ''} onChange={e => handlePropChange('src', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Alt Text</Label>
                          <Input value={props.alt || ''} onChange={e => handlePropChange('alt', e.target.value)} />
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

              </Accordion>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground p-4">
                <p>Select an element on the canvas to edit its styles.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="ai" className="p-0">
            <AiAssistant />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
};

export default RightSidebar;
