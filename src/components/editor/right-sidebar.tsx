import { FC, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Blend } from 'lucide-react';
import AiAssistant from '@/components/editor/ai-assistant';
import { CanvasElementData } from '@/app/page';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, styles: React.CSSProperties) => void;
}

const RightSidebar: FC<RightSidebarProps> = ({ selectedElementId, elements, updateElement }) => {
  const selectedElement = elements.find(el => el.id === selectedElementId);

  const [styles, setStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (selectedElement) {
        setStyles(selectedElement.styles);
    }
  }, [selectedElement]);

  const handleStyleChange = (property: keyof React.CSSProperties, value: string) => {
      const newStyles = {...styles, [property]: value};
      setStyles(newStyles);
      if (selectedElementId) {
          updateElement(selectedElementId, newStyles);
      }
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
          <TabsContent value="style" className="p-4">
            {selectedElement ? (
              <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-medium">Element ID</h3>
                    <p className="text-sm text-muted-foreground break-words">{selectedElement.id}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Typography</h3>
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input value={styles.fontSize || ''} onChange={e => handleStyleChange('fontSize', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Input value={styles.fontWeight as string || ''} onChange={e => handleStyleChange('fontWeight', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Align</Label>
                    <Input value={styles.textAlign as string || ''} onChange={e => handleStyleChange('textAlign', e.target.value)} />
                  </div>
                </div>
                 <div className="space-y-2">
                  <h3 className="font-medium">Color</h3>
                  <div className="flex items-center gap-2">
                     <Input value={styles.color || ''} onChange={e => handleStyleChange('color', e.target.value)} className="flex-1" />
                     <Button variant="outline" size="icon">
                        <Blend className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Spacing</h3>
                   <div className="space-y-2">
                    <Label>Padding</Label>
                    <Input value={styles.padding as string || ''} onChange={e => handleStyleChange('padding', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin</Label>
                    <Input value={styles.margin as string || ''} onChange={e => handleStyleChange('margin', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label>Margin Top</Label>
                    <Input value={styles.marginTop as string || ''} onChange={e => handleStyleChange('marginTop', e.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
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
