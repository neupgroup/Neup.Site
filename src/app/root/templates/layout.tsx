import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
            <Link href="/root/templates" className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Templates</h1>
            </Link>
            <Button asChild>
                <Link href="/site/editor">Back to Editor</Link>
            </Button>
        </header>
        <main className="flex justify-center">
            {children}
        </main>
    </div>
  );
}
