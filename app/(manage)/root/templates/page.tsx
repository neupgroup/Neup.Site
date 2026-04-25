
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTemplates, type Template, deleteTemplate } from '@/services/editor/templates';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, LayoutTemplate, ArrowRight, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/use-page-title';

export default function TemplatesPage() {
  usePageTitle('Templates', 'NeupSites');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const result = await getTemplates();
    if (result.success && result.templates) {
      setTemplates(result.templates.sort((a, b) => (a.name > b.name ? 1 : -1)));
    } else {
      setError(result.error || 'Failed to fetch templates');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-20 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Templates</h1>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/root/templates/guide">
                <BookOpen className="mr-2 h-4 w-4" /> View Guide
              </Link>
            </Button>
            <Button asChild>
              <Link href="/root/templates/create">
                <Plus className="mr-2 h-4 w-4" /> Create New Template
              </Link>
            </Button>
        </div>
      </header>
      {templates.length === 0 ? (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Templates Yet</h3>
            <p>Click "Create New Template" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
             <Link key={template.id} href={`/root/templates/${template.id}`} className="block group">
                <Card className="transition-all h-full group-hover:border-primary group-hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="truncate">{template.name}</CardTitle>
                            <CardDescription>
                                {template.description ? 
                                  (template.description.length > 100 ? `${template.description.substring(0, 100)}...` : template.description) 
                                  : 'No description'
                                }
                            </CardDescription>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </CardHeader>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
