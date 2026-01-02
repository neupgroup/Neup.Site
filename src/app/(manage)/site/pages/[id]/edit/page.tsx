
'use client';

import { use } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Edit, Code, PlusSquare } from 'lucide-react';
import Link from 'next/link';

export default function EditPageHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const editOptions = [
    {
      title: 'Drag & Drop Editor',
      description: 'Visually build your page by dragging and dropping elements.',
      icon: <Edit className="h-8 w-8 text-primary" />,
      href: `/site/pages/${id}/edit/dragger`,
    },
    {
      title: 'Code Editor',
      description: 'Write or paste React/JSX code for full control over the page.',
      icon: <Code className="h-8 w-8 text-primary" />,
      href: `/site/pages/${id}/edit/coder`,
    },
    {
      title: 'Pre-built Sections',
      description: 'Assemble your page quickly from a library of ready-made sections.',
      icon: <PlusSquare className="h-8 w-8 text-primary" />,
      href: `/site/pages/${id}/edit/prebuilt`,
    },
  ];

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Choose Your Editor</h1>
        <p className="text-muted-foreground">How would you like to edit this page?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {editOptions.map((option) => (
          <Link key={option.title} href={option.href} className="group block">
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
