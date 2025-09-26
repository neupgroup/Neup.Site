'use client';
import type { FC } from 'react';
import { useState } from 'react';
import EditorHeader from '@/components/editor/header';
import LeftSidebar from '@/components/editor/left-sidebar';
import RightSidebar from '@/components/editor/right-sidebar';
import Canvas from '@/components/editor/canvas';

const WebsiteBuilderPage: FC = () => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Canvas selectedElement={selectedElement} onSelectElement={setSelectedElement} />
        </main>
        <RightSidebar selectedElement={selectedElement} />
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;
