
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Code, Edit, MessageSquare, PlusSquare, Loader2 } from 'lucide-react';
import { createSite, type Site } from '@/actions/editor/site';
import { useToast } from '@/hooks/use-toast';

type CreationType = Site['type'];

const creationOptions: {
    title: string;
    description: string;
    icon: React.ReactNode;
    type: CreationType;
}[] = [
    {
        title: 'Drag & Drop Editor',
        description: 'Build your page visually by dragging and dropping elements.',
        icon: <Edit className="h-8 w-8 text-primary" />,
        type: 'editor',
    },
    {
        title: 'From Natural Language',
        description: 'Describe the page you want, and let AI build a starting point for you.',
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        type: 'ai',
    },
    {
        title: 'From HTML',
        description: 'Paste your existing HTML and have AI convert it into editable components.',
        icon: <Code className="h-8 w-8 text-primary" />,
        type: 'html',
    },
    {
        title: 'From Pre-built Sections',
        description: 'Assemble your page quickly by using a library of ready-made sections.',
        icon: <PlusSquare className="h-8 w-8 text-primary" />,
        type: 'template',
    }
];

export default function CreatePageHub() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState<CreationType | null>(null);

  const getRedirectUrl = (type: CreationType, id: string) => {
    switch (type) {
        case 'editor':
            return `/site/editor?id=${id}`;
        case 'ai':
            return `/site/editor/textual?id=${id}`;
        case 'html':
            return `/site/editor/coder?id=${id}`;
        case 'template':
            return `/site/editor/prebuilt?id=${id}`;
        default:
            return `/site/editor?id=${id}`;
    }
  }

  const handleCreatePage = async (option: typeof creationOptions[0]) => {
    setIsCreating(option.type);

    const result = await createSite(option.type);

    if (result.success && result.id) {
        toast({ title: 'Page Created!', description: 'Redirecting you to the editor...'});
        
        const redirectUrl = getRedirectUrl(option.type, result.id);

        router.push(redirectUrl);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setIsCreating(null);
    }
  }


  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Create a New Page</h1>
        <p className="text-muted-foreground">Choose how you want to start building your new page.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creationOptions.map((option) => (
          <div key={option.type} onClick={() => !isCreating && handleCreatePage(option)} className="group cursor-pointer">
            <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                </div>
                 {isCreating === option.type ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                    <div className="p-3 bg-primary/10 rounded-lg">
                        {option.icon}
                    </div>
                )}
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
