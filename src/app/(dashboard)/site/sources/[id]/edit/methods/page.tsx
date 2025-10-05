
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source, type SourceMethod } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormValues = {
    methods: SourceMethod[];
};

export default function EditSourceMethodsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<FormValues>({
      defaultValues: {
          methods: [],
      }
  });
  
  const { fields, append, remove, control } = useFieldArray({
      control: methods.control,
      name: 'methods'
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        setSourceName(result.source.name);
        if (result.source.methods) {
            const formattedMethods = result.source.methods.map(m => ({
                ...m,
                headers: m.headers ? JSON.stringify(m.headers, null, 2) : '{}'
            }))
            methods.reset({ methods: formattedMethods as any });
        }
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id, methods]);

  const handleUpdateMethods = async (data: FormValues) => {
    const methodsToSave = data.methods.map(m => {
        try {
            return {
                ...m,
                headers: m.headers ? JSON.parse(m.headers as any) : undefined
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Invalid JSON in Headers', description: `Please check the headers for method: ${m.methodName}`});
            throw new Error("Invalid JSON");
        }
    });

    const result = await updateSource(id, { methods: methodsToSave });

    if (result.success) {
      toast({ title: 'Methods Updated!', description: `Successfully updated methods for ${sourceName}.` });
      router.push(`/site/sources/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
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
      <form onSubmit={methods.handleSubmit(handleUpdateMethods)} className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-headline text-2xl font-semibold tracking-tight">API Methods</h1>
                <p className="text-muted-foreground">For source: <span className="font-semibold">{sourceName}</span></p>
            </div>
            <Button variant="ghost" asChild>
                <Link href={`/site/sources/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
                </Link>
            </Button>
        </div>
        <Card>
             <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Code />Methods</CardTitle>
                 <CardDescription>Define the available functions for this data source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Method Name</Label>
                                <Input {...methods.register(`methods.${index}.methodName`)} placeholder="e.g., getProducts"/>
                            </div>
                            <div className="space-y-2">
                                <Label>HTTP Method</Label>
                                <Select
                                    defaultValue={methods.getValues(`methods.${index}.httpMethod`)}
                                    onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'DELETE') => methods.setValue(`methods.${index}.httpMethod`, value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Endpoint</Label>
                            <Input {...methods.register(`methods.${index}.path`)} placeholder="/products" />
                        </div>
                        <div className="space-y-2">
                            <Label>Headers (JSON, Optional)</Label>
                            <Textarea {...methods.register(`methods.${index}.headers` as any)} placeholder='{ "X-Custom-Header": "value" }' rows={3} className="font-mono"/>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="destructive" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Method
                            </Button>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ methodName: '', path: '', httpMethod: 'GET', headers: '{}' })}>
                    <Plus className="mr-2" /> Add Method
                </Button>
            </CardContent>
        </Card>


        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Saving Methods...' : 'Save Methods'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
