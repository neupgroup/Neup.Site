
'use client';

import { ReactNode, use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditTemplateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const { id } = use(params);
  const activeSection = pathname.includes('/content') ? 'content' : 'basics';

  return (
    <div className="w-full max-w-4xl space-y-6">
       <Button asChild variant="ghost" className="-ml-4">
          <Link href={`/root/templates/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Template
          </Link>
        </Button>
        
      <Card>
        <CardHeader>
            <CardTitle>Edit Template</CardTitle>
            <CardDescription>Modify the template's configuration and content.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
           <Link href={`/root/templates/${id}/edit/basics`} className="block group">
             <Card className={cn("transition-colors", activeSection === 'basics' ? "bg-muted" : "hover:bg-muted/50")}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Edit className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <CardTitle className="text-lg">Basics</CardTitle>
                        <CardDescription>Name, description, and type.</CardDescription>
                    </div>
                </CardHeader>
             </Card>
           </Link>
            <Link href={`/root/templates/${id}/edit/content`} className="block group">
             <Card className={cn("transition-colors", activeSection === 'content' ? "bg-muted" : "hover:bg-muted/50")}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <CardTitle className="text-lg">Content</CardTitle>
                        <CardDescription>Code, JSON, or text content.</CardDescription>
                    </div>
                </CardHeader>
             </Card>
           </Link>
        </CardContent>
      </Card>
      
      {children}

    </div>
  );
}
