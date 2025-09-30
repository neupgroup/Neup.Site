
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Rocket, Undo, Redo, Code, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EditorHeaderProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onViewCode: () => void;
  onPublish: () => void;
  onPreview: () => void;
  isSaving: boolean;
  isPreviewing: boolean;
}

const EditorHeader: FC<EditorHeaderProps> = ({ onUndo, onRedo, canUndo, canRedo, onViewCode, onPublish, onPreview, isSaving, isPreviewing }) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-card px-4 shadow-md md:px-6 z-10 relative">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight text-primary">Neup.Sites</h1>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm text-muted-foreground">Editor</span>
      </div>
       <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview} disabled={isPreviewing || isSaving}>
          {isPreviewing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Preview
        </Button>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={onPublish} disabled={isSaving || isPreviewing}>
           {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save
        </Button>
      </div>
    </header>
  );
};

export default EditorHeader;
