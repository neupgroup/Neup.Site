import { FC } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Type, Image as ImageIcon, MousePointerClick, LayoutTemplate, Rows, Columns, File } from 'lucide-react';

const ContentBlock: FC<{ icon: React.ReactNode; label: string, type: string }> = ({ icon, label, type }) => (
  <div
    className="flex cursor-grab flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary hover:border-primary active:cursor-grabbing"
    draggable
    onDragStart={(e) => {
      const data = { type: 'sidebar-element', elementType: type };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
    }}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </div>
);

const LeftSidebar: FC = () => {
  return (
    <aside className="w-72 border-r bg-card">
      <Tabs defaultValue="add" className="flex h-full flex-col">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="add" className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <ContentBlock icon={<Type className="h-6 w-6" />} label="Text" type="text" />
              <ContentBlock icon={<ImageIcon className="h-6 w-6" />} label="Image" type="image" />
              <ContentBlock icon={<MousePointerClick className="h-6 w-6" />} label="Button" type="button" />
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
