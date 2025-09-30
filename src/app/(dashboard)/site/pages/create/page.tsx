
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Code, Edit, MessageSquare, PlusSquare, Loader2 } from 'lucide-react';
import { createSite } from '@/actions/editor/site';
import { useToast } from '@/hooks/use-toast';

type CreationType = 'editor' | 'ai' | 'html' | 'template';

const creationOptions = [
    {
        title: 'Drag & Drop Editor',
        description: 'Build your page visually by dragging and dropping elements.',
        href: '/site/editor',
        icon: <Edit className="h-8 w-8 text-primary" />,
        type: 'editor' as CreationType,
    },
    {
        title: 'From Natural Language',
        description: 'Describe the page you want, and let AI build a starting point for you.',
        href: '/site/pages/create/from-text',
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        type: 'ai' as CreationType,
    },
    {
        title: 'From HTML',
        description: 'Paste your existing HTML and have AI convert it into editable components.',
        href: '/root/templates/create',
        icon: <Code className="h-8 w-8 text-primary" />,
        type: 'html' as CreationType,
    },
    {
        title: 'From Pre-built Sections',
        description: 'Assemble your page quickly by using a library of ready-made sections.',
        href: '/site/editor',
        icon: <PlusSquare className="h-8 w-8 text-primary" />,
        type: 'template' as CreationType,
    }
];

export default function CreatePageHub() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState<CreationType | null>(null);

  const handleCreatePage = async (option: typeof creationOptions[0]) => {
    setIsCreating(option.type);

    const result = await createSite();

    if (result.success && result.id) {
        toast({ title: 'Page Created!', description: 'Redirecting you to the editor...'});
        
        let redirectUrl = option.href;
        if (option.type === 'editor' || option.type === 'template' || option.type === 'ai') {
             redirectUrl = `/site/editor?mode=edit&id=${result.id}`;
        }
        // For 'html', we still go to the template creator, but the user now has a page context if needed.
        // Or we could decide to redirect all to editor. For now, let's stick to the original href for html.
         if (option.type === 'html') {
             redirectUrl = '/root/templates/create';
         } else if (option.type === 'ai') {
            // For now, AI also goes to the editor. We can change this later.
             redirectUrl = `/site/editor?mode=edit&id=${result.id}`;
             // Or maybe go to a specific AI page first:
             // redirectUrl = `/site/pages/create/from-text?id=${result.id}`;
         }

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
          <div key={option.href} onClick={() => !isCreating && handleCreatePage(option)} className="group cursor-pointer">
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
