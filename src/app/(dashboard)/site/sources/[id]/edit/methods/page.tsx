
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Edit, X, Play, Eraser } from 'lucide-react';
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

const MethodTester = ({ sourceId, method, onResult, onIsLoadingChange }: { sourceId: string; method: SourceMethod, onResult: (result: any) => void, onIsLoadingChange: (isLoading: boolean) => void }) => {
    const [params, setParams] = useState<Record<string, string>>({});
    const dynamicParams = method.path.match(/\[(\w+)\]/g)?.map(p => p.slice(1, -1)) || [];
    
    const handleTest = async () => {
        onIsLoadingChange(true);
        onResult(null); // Clear previous result
        const res = await testApiMethod(sourceId, method, params);
        onResult(res);
        onIsLoadingChange(false);
    };
    
    useEffect(() => {
        // If there are no dynamic parameters, run the test immediately
        if (dynamicParams.length === 0) {
            handleTest();
        }
    }, []);

    if (dynamicParams.length === 0) return null;

    return (
         <div className="space-y-4 pt-4 border-t mt-4">
            <div className="space-y-2">
                <Label>Parameters</Label>
                {dynamicParams.map(param => (
                    <div key={param} className="flex items-center gap-2">
                        <span className="text-sm font-mono text-muted-foreground w-24 truncate">{param}:</span>
                        <Input 
                            value={params[param] || ''} 
                            onChange={e => setParams({...params, [param]: e.target.value })} 
                            className="h-8"
                        />
                    </div>
                ))}
                    <Button size="sm" onClick={handleTest} className="mt-2">
                    <Play className="mr-2" /> Run Test
                </Button>
            </div>
        </div>
    );
};


const MethodCard = ({ index, onRemove, sourceId, isEditing, setEditingIndex }: { index: number, onRemove: () => void, sourceId: string, isEditing: boolean, setEditingIndex: (index: number | null) => void }) => {
    const { control, getValues, register, resetField } = useFormContext<FormValues>();
    const [originalState, setOriginalState] = useState<SourceMethod | null>(null);
    const [showTester, setShowTester] = useState(false);
    const [testResult, setTestResult] = useState<any | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const startEditing = () => {
        setOriginalState(getValues(`methods.${index}`));
        setShowTester(false);
        setTestResult(null);
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
    
    const toggleTester = () => {
        if (isEditing) return;
        setShowTester(prev => !prev);
        if (showTester) { // if we are closing it
            setTestResult(null);
        }
    }
    
    const handleClearTest = () => {
        setShowTester(false);
        setTestResult(null);
    }

    const methodData = getValues(`methods.${index}`);
    const headersValue = getValues(`methods.${index}.headers` as any) as string;
    const showHeaders = isEditing || (headersValue && headersValue.trim() !== '{}' && headersValue.trim() !== '');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="truncate">
                        {getValues(`methods.${index}.methodName`) || `New Method`}
                    </CardTitle>
                    {!isEditing && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleTester}>
                            <Play className="h-4 w-4" />
                        </Button>
                    )}
                </div>
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
                {showTester && <MethodTester sourceId={sourceId} method={methodData} onResult={setTestResult} onIsLoadingChange={setIsTesting} />}

                {(isTesting || testResult) && (
                    <div className="space-y-2 pt-4 border-t mt-4">
                        <Label>Response</Label>
                        {isTesting && !testResult && (
                             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="animate-spin h-4 w-4" />
                                <span>Loading...</span>
                            </div>
                        )}
                        {testResult && (
                             <Textarea
                                readOnly
                                value={testResult.success ? JSON.stringify(testResult.data, null, 2) : `Error: ${testResult.error}`}
                                className="font-mono text-xs h-48 bg-muted"
                            />
                        )}
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
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                            <Edit className="mr-2" /> Edit
                        </Button>
                        {testResult && (
                            <Button type="button" variant="outline" size="sm" onClick={handleClearTest}>
                                <Eraser className="mr-2"/> Clear
                            </Button>
                        )}
                    </>
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

  const formMethods = useForm<FormValues>({
      defaultValues: {
          methods: [],
      }
  });
  
  const { fields, append, remove, control, getValues } = useFieldArray({
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
      const existingMethods = getValues('methods');
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
