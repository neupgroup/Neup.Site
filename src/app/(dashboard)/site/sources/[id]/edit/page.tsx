
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type FormValues = {
  name: string;
  basePath: string;
  methods: {
    methodName: string;
    subPath: string;
    responseFormat: {
      correct: string;
      incorrect: string;
    };
    moreDetails: string;
  }[];
};

export default function EditSourcePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<FormValues>({
      defaultValues: {
          name: '',
          basePath: '',
          methods: [],
      }
  });
  
  const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: 'methods'
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        methods.reset({
            name: result.source.name,
            basePath: result.source.basePath,
            methods: result.source.methods || [],
        });
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id, methods]);

  const handleUpdateSource = async (data: FormValues) => {
    const result = await updateSource(id, data);

    if (result.success) {
      toast({ title: 'Source Updated!', description: `Successfully updated ${data.name}.` });
      router.push(`/site/sources/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const { isSubmitting } = methods.formState;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleUpdateSource)} className="w-full max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Data Source</CardTitle>
            <CardDescription>Update the details and methods for your data source.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Source Name</Label>
              <Input id="source-name" {...methods.register('name')} placeholder="e.g., My CRM API" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-path">Base Path</Label>
              <Input id="base-path" {...methods.register('basePath')} placeholder="https://api.example.com/v1" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Methods</CardTitle>
                        <CardDescription>Define the available API calls for this source.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ methodName: '', subPath: '/', moreDetails: '', responseFormat: { correct: '', incorrect: '' } })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Method
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-lg relative space-y-4 bg-muted/30">
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2 text-primary">
                            <Code className="h-5 w-5" />
                            <h4 className="font-semibold">Method #{index + 1}</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Method Name</Label>
                                <Input {...methods.register(`methods.${index}.methodName`)} placeholder="e.g., getUserDetails" />
                            </div>
                            <div className="space-y-2">
                                <Label>Sub Path</Label>
                                <Input {...methods.register(`methods.${index}.subPath`)} placeholder="/users/{userId}" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>More Details</Label>
                            <Textarea {...methods.register(`methods.${index}.moreDetails`)} placeholder="Briefly describe what this method does." />
                        </div>
                        <div className="space-y-2">
                            <Label>Correct Response Format</Label>
                            <Input {...methods.register(`methods.${index}.responseFormat.correct`)} placeholder={`e.g., { "user": { "name": "..." } }`} />
                        </div>
                         <div className="space-y-2">
                            <Label>Incorrect Response Format</Label>
                            <Input {...methods.register(`methods.${index}.responseFormat.incorrect`)} placeholder={`e.g., { "error": "User not found" }`} />
                        </div>
                    </div>
                ))}
                {fields.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-8">No methods defined. Click "Add Method" to start.</p>
                )}
            </CardContent>
        </Card>

        <div className="flex justify-between sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm">
          <Button variant="ghost" asChild>
            <Link href={`/site/sources/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
