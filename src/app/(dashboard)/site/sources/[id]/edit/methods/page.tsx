
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider, useFormContext, Controller } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Edit, X, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, testApiMethod, type Source, type SourceMethod } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormValues = {
    methods: SourceMethod[];
};

const TestMethodDialog = ({ sourceId, method, children }: { sourceId: string, method: SourceMethod, children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [params, setParams] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dynamicParams = method.path.match(/\[(\w+)\]/g)?.map(p => p.slice(1, -1)) || [];
    
    const handleTest = async () => {
        setIsLoading(true);
        setResult(null);
        const res = await testApiMethod(sourceId, method, params);
        setResult(res);
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Test API Method</DialogTitle>
                    <DialogDescription>
                        Run a test request for the <span className="font-mono bg-muted px-1 py-0.5 rounded">{method.methodName}</span> method.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {dynamicParams.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-medium">Parameters</h4>
                            {dynamicParams.map(param => (
                                <div key={param} className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={param} className="text-right">{param}</Label>
                                    <Input id={param} value={params[param] || ''} onChange={e => setParams({...params, [param]: e.target.value })} className="col-span-3" />
                                </div>
                            ))}
                        </div>
                    )}
                    {result && (
                        <div className="space-y-2">
                             <h4 className="font-medium">Result</h4>
                             <div className="max-h-64 overflow-auto rounded-md bg-muted p-4">
                                {result.success ? (
                                    <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
                                ) : (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{result.error}</AlertDescription>
                                    </Alert>
                                )}
                             </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleTest} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />}
                        Run Test
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const MethodCard = ({ index, onRemove, sourceId, isEditing, setEditingIndex }: { index: number, onRemove: () => void, sourceId: string, isEditing: boolean, setEditingIndex: (index: number | null) => void }) => {
    const { control, getValues, register, formState: { errors }, resetField } = useFormContext<FormValues>();
    const [originalState, setOriginalState] = useState<SourceMethod | null>(null);

    const startEditing = () => {
        setOriginalState(getValues(`methods.${index}`));
        setEditingIndex(index);
    };
    
    const cancelEditing = () => {
        if (originalState) {
             resetField(`methods.${index}`, { defaultValue: originalState });
        }
        setEditingIndex(null);
        setOriginalState(null);
    };
    
    const saveEditing = () => {
        setEditingIndex(null);
        setOriginalState(null);
    }

    const methodData = getValues(`methods.${index}`);
    const headersValue = getValues(`methods.${index}.headers` as any) as string;
    const showHeaders = isEditing || (headersValue && headersValue.trim() !== '{}' && headersValue.trim() !== '');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="truncate flex items-center gap-2">
                    {getValues(`methods.${index}.methodName`) || `New Method`}
                     {!isEditing && (
                        <TestMethodDialog sourceId={sourceId} method={methodData}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Play className="h-4 w-4" />
                            </Button>
                        </TestMethodDialog>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Method Name</Label>
                        <Input {...register(`methods.${index}.methodName`)} placeholder="e.g., getProducts" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>HTTP Method</Label>
                        <Controller
                            control={control}
                            name={`methods.${index}.httpMethod`}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!isEditing}
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
                            )}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input {...register(`methods.${index}.path`)} placeholder="/products" disabled={!isEditing} />
                </div>
                {showHeaders && (
                    <div className="space-y-2">
                        <Label>Headers (JSON, Optional)</Label>
                        <Textarea {...register(`methods.${index}.headers` as any)} placeholder='{ "X-Custom-Header": "value" }' rows={3} className="font-mono" disabled={!isEditing} />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-start gap-2">
                {isEditing ? (
                    <>
                        <Button type="button" size="sm" onClick={saveEditing}>
                            <Save className="mr-2" /> Save
                        </Button>
                         <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                             <X className="mr-2" /> Cancel
                        </Button>
                         <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
                            <Trash2 className="mr-2" /> Remove
                        </Button>
                    </>
                ) : (
                    <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                        <Edit className="mr-2" /> Edit
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

const AddNewMethodCard = ({ onAdd }: { onAdd: (name: string) => void }) => {
    const [newMethodName, setNewMethodName] = useState('');

    const handleAddClick = () => {
        if (!newMethodName) return;
        onAdd(newMethodName);
        setNewMethodName('');
    };

    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle>Add New Method</CardTitle>
                <CardDescription>Define a new function for this data source.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <Label htmlFor="new-method-name">New Method Name</Label>
                    <div className="flex gap-2">
                        <Input
                            id="new-method-name"
                            value={newMethodName}
                            onChange={(e) => setNewMethodName(e.target.value)}
                            placeholder="e.g., getUserProfile"
                        />
                        <Button type="button" onClick={handleAddClick} disabled={!newMethodName}>
                            <Plus className="mr-2"/> Add Method
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function EditSourceMethodsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const formMethods = useForm<FormValues>({
      defaultValues: {
          methods: [],
      }
  });
  
  const { fields, append, remove, control } = useFieldArray({
      control: formMethods.control,
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
            formMethods.reset({ methods: formattedMethods as any });
        }
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id, formMethods]);
  
  const handleAddNewMethod = (name: string) => {
      const existingMethods = formMethods.getValues('methods');
      if (existingMethods.some(method => method.methodName.toLowerCase() === name.toLowerCase())) {
          toast({
              variant: 'destructive',
              title: 'Duplicate Method Name',
              description: `A method named "${name}" already exists for this source.`
          });
          return;
      }
      
      append({
          methodName: name,
          httpMethod: 'GET',
          path: '',
          headers: '{}' as any
      });
      setEditingIndex(fields.length);
  };
  
  const handleUpdateMethods = async (data: FormValues) => {
    let methodsToSave;
    try {
        methodsToSave = data.methods.map(m => ({
            ...m,
            headers: m.headers ? JSON.parse(m.headers as any) : undefined
        }));
    } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON in Headers', description: `Please check the headers for all methods.`});
        return;
    }

    const result = await updateSource(id, { methods: methodsToSave });

    if (result.success) {
      toast({ title: 'Methods Updated!', description: `Successfully updated methods for ${sourceName}.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return (
        <div className="w-full max-w-4xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
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
  
  const { isSubmitting } = formMethods.formState;

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(handleUpdateMethods)} className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-muted-foreground">Editing methods for: <span className="font-semibold">{sourceName}</span></p>
            </div>
            <Button variant="ghost" asChild>
                <Link href={`/site/sources/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
                </Link>
            </Button>
        </div>
        
        {fields.map((field, index) => (
            <MethodCard 
                key={field.id} 
                index={index} 
                onRemove={() => remove(index)}
                sourceId={id}
                isEditing={editingIndex === index}
                setEditingIndex={setEditingIndex}
            />
        ))}

        <AddNewMethodCard onAdd={handleAddNewMethod} />
        
        <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm mt-6">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save All Changes
            </Button>
        </div>
      </form>
    </FormProvider>
  );
}
