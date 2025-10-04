
'use client';
import { FC, useState, useEffect } from 'react';
import { Database, LinkIcon, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSources, type Source } from '@/actions/editor/sources';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { setPageDataSource, getPageDataSource } from '@/actions/editor/data';

interface PageDataSourceProps {
    pageId: string;
}

const PageDataSource: FC<PageDataSourceProps> = ({ pageId }) => {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [selectedMethodName, setSelectedMethodName] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sourcesResult, currentBindingResult] = await Promise.all([
                    getSources(),
                    getPageDataSource(pageId)
                ]);

                if (sourcesResult.success && sourcesResult.sources) {
                    setSources(sourcesResult.sources);
                } else {
                    setError(sourcesResult.error || 'Failed to load data sources.');
                }
                
                if (currentBindingResult.success && currentBindingResult.binding) {
                    setSelectedSourceId(currentBindingResult.binding.sourceId);
                    setSelectedMethodName(currentBindingResult.binding.methodName);
                }

            } catch (e: any) {
                setError('An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pageId]);

    const handleSave = async () => {
        if (!selectedSourceId || !selectedMethodName) {
            toast({ variant: 'destructive', title: 'Missing selection', description: 'Please select both a source and a method.'});
            return;
        }
        setIsSaving(true);
        const result = await setPageDataSource(pageId, selectedSourceId, selectedMethodName);
        if (result.success) {
            toast({ title: 'Data Source Linked!', description: 'The page is now connected to the selected data source method.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    const selectedSource = sources.find(s => s.id === selectedSourceId);
    
    return (
        <div className="flex h-full flex-col">
            <header className="flex items-center gap-4 p-4 border-b">
                <Database className="h-6 w-6" />
                <h2 className="text-lg font-semibold font-headline">Page Data Source</h2>
            </header>
            <div className="p-4 space-y-6 flex-1">
                {loading && (
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
                {error && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!loading && !error && (
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
                                        {selectedSource.methods.map(method => (
                                            <SelectItem key={method.methodName} value={method.methodName}>{method.methodName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
            <div className="p-4 border-t">
                <Button className="w-full" onClick={handleSave} disabled={isSaving || loading || !selectedSourceId || !selectedMethodName}>
                    {isSaving ? 'Saving...' : 'Link Data to Page'}
                </Button>
            </div>
        </div>
    );
}

export default PageDataSource;
