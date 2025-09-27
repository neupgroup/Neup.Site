import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Rocket, Undo, Redo, Code } from 'lucide-react';

interface EditorHeaderProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onViewCode: () => void;
  onPublish: () => void;
}

const EditorHeader: FC<EditorHeaderProps> = ({ onUndo, onRedo, canUndo, canRedo, onViewCode, onPublish }) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight">Neup.Sites</h1>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm text-muted-foreground">Page: Home</span>
      </div>
       <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={onPublish}>
          Publish
        </Button>
      </div>
    </header>
  );
};

export default EditorHeader;

    