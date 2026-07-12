
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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Edit, X, Play, Eraser } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { getSource, updateSource, testApiMethod, type Source, type SourceMethod, ApiSource } from '@/services/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    <Button variant="primary" size="sm" onClick={handleTest} className="mt-2">
                    <Play className="mr-2" /> Run Test
                </Button>
            </div>
        </div>
    );
};


const MethodCard = ({ method, source, onUpdate, onRemove }: { method: SourceMethod, source: Source, onUpdate: (methodName: string, newMethodData: SourceMethod) => Promise<void>, onRemove: (methodName: string) => Promise<void> }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMethod, setEditedMethod] = useState<SourceMethod>(method);
    const [showTester, setShowTester] = useState(false);
    const [testResult, setTestResult] = useState<any | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setEditedMethod(method);
    }, [method]);

    const startEditing = () => {
        setIsEditing(true);
        setShowTester(false);
        setTestResult(null);
    };
    
    const cancelEditing = () => {
        setEditedMethod(method);
        setIsEditing(false);
    };
    
    const saveEditing = async () => {
        setIsSaving(true);
        try {
            await onUpdate(method.methodName, editedMethod);
            setIsEditing(false);
            toast({ title: 'Method Saved', description: `Method "${editedMethod.methodName}" has been updated.`});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
        } finally {
            setIsSaving(false);
        }
    }

    const handleRemove = async () => {
        try {
            await onRemove(method.methodName);
            toast({ title: 'Method Removed' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error Removing', description: e.message });
        }
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

    const handleFieldChange = (key: keyof SourceMethod, value: any) => {
        setEditedMethod(prev => ({...prev, [key]: value}));
    };
    
    const currentMethodData = isEditing ? editedMethod : method;
    const headersString = typeof currentMethodData.headers === 'object' 
        ? JSON.stringify(currentMethodData.headers, null, 2)
        : currentMethodData.headers || '{}';

    const showHeaders = isEditing || (headersString && headersString.trim() !== '{}' && headersString.trim() !== '');
    const baseUrl = source.type === 'api' ? (source as ApiSource).url : '';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="truncate">
                        {method.methodName}
                    </CardTitle>
                    {!isEditing && (
                        <Button variant="plain" size="icon" className="h-7 w-7" onClick={toggleTester}>
                            <Play className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Method Name</Label>
                        <Input value={currentMethodData.methodName} placeholder="e.g., getProducts" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>HTTP Method</Label>
                        <Select
                            value={currentMethodData.httpMethod}
                            onValueChange={(v) => handleFieldChange('httpMethod', v)}
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
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <div className="flex items-center rounded-md border border-input bg-background has-[:disabled]:opacity-70">
                        {baseUrl && <span className="text-sm text-muted-foreground px-3 font-mono">{baseUrl}</span>}
                        <Input 
                            value={currentMethodData.path} 
                            onChange={(e) => handleFieldChange('path', e.target.value)} 
                            placeholder="/products/[productId]" 
                            disabled={!isEditing} 
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
                {showHeaders && (
                    <div className="space-y-2">
                        <Label>Headers (JSON, Optional)</Label>
                        <Textarea 
                            value={headersString} 
                            onChange={(e) => handleFieldChange('headers', e.target.value)}
                            placeholder='{ "X-Custom-Header": "value" }' 
                            rows={3} 
                            className="font-mono" 
                            disabled={!isEditing} 
                        />
                    </div>
                )}
                {showTester && <MethodTester sourceId={source.id} method={currentMethodData} onResult={setTestResult} onIsLoadingChange={setIsTesting} />}

                {(isTesting || testResult) && (
                    <div className="space-y-2 pt-4 border-t mt-4">
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
            <div className="flex justify-start gap-2 p-6 pt-0">
                {isEditing ? (
                    <>
                        <Button type="button" size="sm" onClick={saveEditing} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                         <Button type="button" variant="plain" size="sm" onClick={cancelEditing}>
                             <X className="mr-2" /> Cancel
                        </Button>
                         <Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
                            <Trash2 className="mr-2" /> Remove
                        </Button>
                    </>
                ) : (
                    <>
                        <Button type="button" variant="tertiary" size="sm" onClick={startEditing}>
                            <Edit className="mr-2" /> Edit
                        </Button>
                        {testResult && (
                            <Button type="button" variant="tertiary" size="sm" onClick={handleClearTest}>
                                <Eraser className="mr-2"/> Clear
                            </Button>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};

const AddNewMethodCard = ({ onAdd, existingMethodNames }: { onAdd: (name: string) => void, existingMethodNames: string[] }) => {
    const [newMethodName, setNewMethodName] = useState('');
    const { toast } = useToast();

    const handleAddClick = () => {
        const trimmedName = newMethodName.trim();
        if (!trimmedName) return;

        if (existingMethodNames.some(name => name.toLowerCase() === trimmedName.toLowerCase())) {
          toast({
              variant: 'destructive',
              title: 'Duplicate Method Name',
              description: `A method named "${trimmedName}" already exists for this source.`
          });
          return;
      }

        onAdd(trimmedName);
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
                        <Button variant="primary" type="button" onClick={handleAddClick} disabled={!newMethodName}>
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
  const [source, setSource] = useState<Source | null>(null);
  const [methods, setMethods] = useState<SourceMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
          setSource(result.source);
          setMethods(result.source.methods || []);
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
  }

  useEffect(() => {
    fetchSource();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  const handleAddNewMethod = (name: string) => {
    const newMethod: SourceMethod = {
        methodName: name,
        httpMethod: 'GET',
        path: '',
        headers: {}
    };
    const updatedMethods = [...methods, newMethod];
    
    updateSource(id, { methods: updatedMethods }).then(result => {
      if (result.success) {
        setMethods(updatedMethods);
        toast({ title: "Method Added", description: `You can now configure the "${name}" method.`});
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleUpdateMethod = async (methodName: string, newMethodData: SourceMethod) => {
    let parsedHeaders;
    try {
        if (typeof newMethodData.headers === 'string') {
            parsedHeaders = newMethodData.headers ? JSON.parse(newMethodData.headers) : {};
        } else {
            parsedHeaders = newMethodData.headers || {};
        }
    } catch (e) {
        throw new Error("Headers are not valid JSON.");
    }

    const updatedMethods = methods.map(m => 
        m.methodName === methodName ? { ...newMethodData, headers: parsedHeaders } : m
    );
    
    const result = await updateSource(id, { methods: updatedMethods });

    if (result.success) {
      setMethods(updatedMethods);
    } else {
      throw new Error(result.error);
    }
  };

  const handleRemoveMethod = async (methodName: string) => {
      const updatedMethods = methods.filter(m => m.methodName !== methodName);
      const result = await updateSource(id, { methods: updatedMethods });
      if (result.success) {
          setMethods(updatedMethods);
      } else {
          throw new Error(result.error);
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

  if (error || !source) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-muted-foreground">Editing methods for: <span className="font-semibold">{source?.name}</span></p>
            </div>
            <Button variant="plain" asChild>
                <Link href={`/site/sources/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
                </Link>
            </Button>
        </div>
        
        {methods.map((method) => (
            <MethodCard 
                key={method.methodName} 
                method={method} 
                source={source}
                onUpdate={handleUpdateMethod}
                onRemove={handleRemoveMethod}
            />
        ))}

        <AddNewMethodCard 
            onAdd={handleAddNewMethod} 
            existingMethodNames={methods.map(m => m.methodName)} 
        />
      </div>
  );
}

    