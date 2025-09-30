
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Code, Edit, MessageSquare, PlusSquare } from 'lucide-react';

const creationOptions = [
    {
        title: 'Drag & Drop Editor',
        description: 'Build your page visually by dragging and dropping elements.',
        href: '/site/editor',
        icon: <Edit className="h-8 w-8 text-primary" />,
        type: 'editor',
    },
    {
        title: 'From Natural Language',
        description: 'Describe the page you want, and let AI build a starting point for you.',
        href: '/site/pages/create/from-text',
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        type: 'ai',
    },
    {
        title: 'From HTML',
        description: 'Paste your existing HTML and have AI convert it into editable components.',
        href: '/root/templates/create',
        icon: <Code className="h-8 w-8 text-primary" />,
        type: 'html',
    },
    {
        title: 'From Pre-built Sections',
        description: 'Assemble your page quickly by using a library of ready-made sections.',
        href: '/site/editor',
        icon: <PlusSquare className="h-8 w-8 text-primary" />,
        type: 'template',
    }
];

export default function CreatePageHub() {
  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Create a New Page</h1>
        <p className="text-muted-foreground">Choose how you want to start building your new page.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creationOptions.map((option) => (
          <Link key={option.href} href={option.href} className="group">
            <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                    {option.icon}
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
