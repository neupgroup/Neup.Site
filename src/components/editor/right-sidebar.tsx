import { FC } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Blend } from 'lucide-react';
import AiAssistant from '@/components/editor/ai-assistant';

interface RightSidebarProps {
  selectedElement: string | null;
}

const RightSidebar: FC<RightSidebarProps> = ({ selectedElement }) => {
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
                  <h3 className="font-medium">Typography</h3>
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input defaultValue="16px" />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Input defaultValue="Normal" />
                  </div>
                </div>
                 <div className="space-y-2">
                  <h3 className="font-medium">Color</h3>
                  <div className="flex items-center gap-2">
                     <Input defaultValue="#000000" className="flex-1" />
                     <Button variant="outline" size="icon">
                        <Blend className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Spacing</h3>
                   <div className="space-y-2">
                    <Label>Padding</Label>
                    <Input placeholder="16px 32px" />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin</Label>
                    <Input placeholder="0px" />
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
