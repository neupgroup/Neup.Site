
'use client';

import { ReactNode, use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

export default function EditTemplateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const { id } = use(params);
  const activeTab = pathname.includes('/content') ? 'content' : 'basics';

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
        <CardContent>
            <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basics" asChild>
                       <Link href={`/root/templates/${id}/edit/basics`}>Basics</Link>
                    </TabsTrigger>
                    <TabsTrigger value="content" asChild>
                        <Link href={`/root/templates/${id}/edit/content`}>Content</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </CardContent>
      </Card>
      
      {children}

    </div>
  );
}
