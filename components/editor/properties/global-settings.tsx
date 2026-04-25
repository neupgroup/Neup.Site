import { FC, useState, useEffect } from 'react';
import { Settings, RefreshCw, Database } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/schemas/canvas';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getSources, type Source } from '@/services/editor/sources';
import { setPageDataSource, getPageDataSource } from '@/services/editor/data';

const breakpoints = [
    { name: 'sm', value: '640px' },
    { name: 'md', value: '768px' },
    { name: 'lg', value: '1024px' },
    { name: 'xl', value: '1280px' },
    { name: '2xl', value: '1536px' },
];

interface PageDataSourceProps {
    pageId?: string;
    onSave?: () => Promise<string | undefined>;
}

const PageDataSourceSection: FC<PageDataSourceProps> = ({ pageId: initialPageId, onSave }) => {
    const [pageId, setPageId] = useState(initialPageId);
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [selectedMethodName, setSelectedMethodName] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setPageId(initialPageId);
        if (initialPageId) {
            fetchData(initialPageId);
        } else {
            // Still fetch sources even if pageId is not there yet.
            fetchData();
        }
    }, [initialPageId]);

    const fetchData = async (pId?: string) => {
        setLoading(true);
        try {
            const sourcesResult = await getSources();
            if (sourcesResult.success && sourcesResult.sources) {
                setSources(sourcesResult.sources);
            } else {
                setError(sourcesResult.error || 'Failed to load data sources.');
            }
            
            if (pId) {
                const currentBindingResult = await getPageDataSource(pId);
                if (currentBindingResult.success && currentBindingResult.binding) {
                    setSelectedSourceId(currentBindingResult.binding.sourceId);
                    setSelectedMethodName(currentBindingResult.binding.methodName);
                }
            }
        } catch (e: any) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        let currentPageId = pageId;

        if (!currentPageId && onSave) {
            currentPageId = await onSave();
            if (currentPageId) {
                setPageId(currentPageId);
            }
        }

        if (!currentPageId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the page to link the data source.' });
            return;
        }

        if (!selectedSourceId || !selectedMethodName) {
            toast({ variant: 'destructive', title: 'Missing selection', description: 'Please select both a source and a method.'});
            return;
        }
        
        setIsSaving(true);
        const result = await setPageDataSource(currentPageId, selectedSourceId, selectedMethodName);
        if (result.success) {
            toast({ title: 'Data Source Linked!', description: 'The page is now connected to the selected data source method.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    const selectedSource = sources.find(s => s.id === selectedSourceId);
    
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {!error && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="data-source">Data Source</Label>
                        <Select value={selectedSourceId} onValueChange={v => {setSelectedSourceId(v); setSelectedMethodName('');}}>
                            <SelectTrigger id="data-source">
                                <SelectValue placeholder="Select a source..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sources.map(source => (
                                    <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedSource && (
                        <div className="space-y-2">
                            <Label htmlFor="data-method">Method</Label>
                            <Select value={selectedMethodName} onValueChange={setSelectedMethodName}>
                                <SelectTrigger id="data-method">
                                    <SelectValue placeholder="Select a method..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(selectedSource as any).methods?.map((method: any) => (
                                        <SelectItem key={method.methodName} value={method.methodName}>{method.methodName}</SelectItem>
                                    )) || []}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                     <Button className="w-full" onClick={handleSave} disabled={isSaving || loading || !selectedSourceId || !selectedMethodName}>
                        {isSaving ? 'Saving...' : 'Link Data to Page'}
                    </Button>
                    {sources.length === 0 && (
                        <Alert>
                            <LinkIcon className="h-4 w-4" />
                            <AlertTitle>No Sources Found</AlertTitle>
                            <AlertDescription>
                                You haven't created any data sources yet.
                                <Button asChild variant="link" className="p-0 h-auto ml-1">
                                    <a href="/site/sources/create">Create one now.</a>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
};


interface GlobalSettingsProps {
    elements: CanvasElementData[];
    onUpdateAllElements: (elements: CanvasElementData[]) => void;
    pageId?: string;
    onSave?: () => Promise<string | undefined>;
}

const GlobalSettings: FC<GlobalSettingsProps> = ({ elements, onUpdateAllElements, pageId, onSave }) => {
    const [jsonString, setJsonString] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        setJsonString(JSON.stringify(elements, null, 2));
    }, [elements]);

    const handleJsonUpdate = () => {
        try {
            const newElements = JSON.parse(jsonString);
            if (Array.isArray(newElements)) {
                onUpdateAllElements(newElements);
                toast({ title: "Canvas Updated", description: "The site structure has been updated from the JSON." });
            } else {
                throw new Error("JSON must be an array of elements.");
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Invalid JSON", description: error.message });
        }
    };


  return (
    <div className="flex h-full flex-col">
        <header className="flex items-center gap-4 p-4 border-b">
             <Settings className="h-6 w-6" />
             <h2 className="text-lg font-semibold font-headline">Global Settings</h2>
        </header>
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="data-source">
                        <AccordionTrigger className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" /> Page Data Source
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <PageDataSourceSection pageId={pageId} onSave={onSave} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="css-framework">
                        <AccordionTrigger className="text-sm font-medium">CSS Framework</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Framework Choice</AlertTitle>
                                <AlertDescription>
                                This project is built with Tailwind CSS. Changing the CSS framework is not supported.
                                </AlertDescription>
                            </Alert>
                            <RadioGroup defaultValue="tailwind" disabled>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="tailwind" id="tailwind" />
                                    <Label htmlFor="tailwind">Tailwind CSS</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bootstrap" id="bootstrap" />
                                    <Label htmlFor="bootstrap">Bootstrap</Label>
                                </div>
                            </RadioGroup>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="breakpoints">
                        <AccordionTrigger className="text-sm font-medium">Breakpoints</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">These are the default breakpoints from Tailwind CSS. Customizing them will be available in a future update.</p>
                        <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {breakpoints.map(bp => (
                                        <TableRow key={bp.name}>
                                            <TableCell className="font-mono text-xs">{bp.name}</TableCell>
                                            <TableCell>
                                                <Input disabled value={bp.value} className="h-8" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                        </Table>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="container-margins">
                        <AccordionTrigger className="text-sm font-medium">Container Margins</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Default container padding for each breakpoint. This is based on Tailwind's defaults.</p>
                            <div className="space-y-2">
                                <Label>Default</Label>
                                <Input disabled value="1rem" className="h-8" />
                            </div>
                            {breakpoints.map(bp => (
                                <div className="space-y-2" key={bp.name}>
                                    <Label className="font-mono text-xs">{bp.name}</Label>
                                    <Input disabled value="2rem" className="h-8" />
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="site-json">
                        <AccordionTrigger className="text-sm font-medium">Artifact JSON</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                View and edit the JSON structure of your entire site. Changes here will update the canvas.
                            </p>
                            <Textarea
                                value={jsonString}
                                onChange={(e) => setJsonString(e.target.value)}
                                rows={20}
                                className="font-mono text-xs"
                            />
                            <Button onClick={handleJsonUpdate} className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Update Canvas
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </ScrollArea>
    </div>
  );
};

export default GlobalSettings;
