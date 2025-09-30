
import { FC, useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const breakpoints = [
    { name: 'sm', value: '640px' },
    { name: 'md', value: '768px' },
    { name: 'lg', value: '1024px' },
    { name: 'xl', value: '1280px' },
    { name: '2xl', value: '1536px' },
];

interface GlobalSettingsProps {
    elements: CanvasElementData[];
    onUpdateAllElements: (elements: CanvasElementData[]) => void;
}

const GlobalSettings: FC<GlobalSettingsProps> = ({ elements, onUpdateAllElements }) => {
    const [jsonString, setJsonString] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        setJsonString(JSON.stringify(elements, null, 2));
    }, [elements]);

    const handleJsonUpdate = () => {
        try {
            const newElements = JSON.parse(jsonString);
            // Basic validation
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
        <div className="flex-1 p-4 space-y-6">
            <Accordion type="single" collapsible defaultValue="css-framework" className="w-full">
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
                    <AccordionTrigger className="text-sm font-medium">Site JSON</AccordionTrigger>
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
    </div>
  );
};

export default GlobalSettings;
