
'use client';
import * as React from "react"
import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ServerCrash, HardDrive, Wifi, Cpu, ListTree, AlertCircle, ChevronDown, Folder, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { getDetailedStorageForServer, type StorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';
import { getActivePorts, type ActivePortInfo } from '@/actions/server/management/get-active-ports';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { getPm2Processes, type ProcessManagerInfo } from '@/actions/server/management/get-pm2-processes';
import { getFileList, type FileInfo } from '@/actions/server/management/get-file-list';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const StorageStatusSection = ({ serverId, isExpanded }: { serverId: string; isExpanded: boolean; }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getDetailedStorageForServer(serverId);
    if (result.success && result.data) {
      setStorageInfo(result.data);
    } else {
      setError(result.error || 'Failed to fetch storage info.');
    }
    setIsLoading(false);
  }, [serverId]);
  
  React.useEffect(() => {
    if (isExpanded && !storageInfo) {
      fetchStorage();
    }
  }, [isExpanded, storageInfo, fetchStorage]);

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
           <Skeleton className="h-8 w-1/2" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : storageInfo ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-sm font-medium">{storageInfo.usePercentage} Used</p>
              <p className="text-sm text-muted-foreground">{storageInfo.used} of {storageInfo.size}</p>
            </div>
            <Progress value={parseInt(storageInfo.usePercentage)} />
          </div>
          <div className="grid grid-cols-2 text-sm">
             <div className="flex justify-between pr-4">
                <span>Available:</span>
                <span className="font-medium">{storageInfo.available}</span>
             </div>
             <div className="flex justify-between">
                <span>Mounted On:</span>
                <span className="font-mono">{storageInfo.mountedOn}</span>
             </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-4">
          <p>Click to load storage status.</p>
        </div>
      )}
    </>
  );
};

const ActivePortsSection = ({ serverId, isExpanded }: { serverId: string, isExpanded: boolean }) => {
  const [ports, setPorts] = useState<ActivePortInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPorts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActivePorts(serverId);
    if (result.success) {
      setPorts(result.ports || []);
    } else {
      setError(result.error || 'Failed to fetch active ports.');
    }
    setIsLoading(false);
  }, [serverId]);

  React.useEffect(() => {
    if (isExpanded && !ports) {
      fetchPorts();
    }
  }, [isExpanded, ports, fetchPorts]);

  return (
    <>
      {isLoading ? (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : ports && ports.length > 0 ? (
          <div className="space-y-2">
            {ports.map((portInfo, index) => (
              <div key={`${portInfo.port}-${portInfo.protocol}-${index}`} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md hover:bg-muted">
                <div className="flex items-center gap-4">
                  <span className="font-bold w-12">{portInfo.port}</span>
                  <Badge variant="outline" className="w-14 justify-center">{portInfo.protocol}</Badge>
                   {portInfo.process && (
                      <span className="font-mono text-xs text-muted-foreground truncate" title={portInfo.process}>
                        {portInfo.process}
                      </span>
                  )}
                </div>
                <span className="font-mono text-xs">{portInfo.address}</span>
              </div>
            ))}
          </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <p>No active ports found.</p>
        </div>
      )}
    </>
  );
};

const ActiveProcessesSection = ({ serverId, isExpanded }: { serverId: string, isExpanded: boolean }) => {
  const [processes, setProcesses] = useState<ProcessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActiveProcesses(serverId);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch active processes.');
    }
    setIsLoading(false);
  }, [serverId]);

  React.useEffect(() => {
    if (isExpanded && !processes) {
      fetchProcesses();
    }
  }, [isExpanded, processes, fetchProcesses]);

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between p-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : processes && processes.length > 0 ? (
        <div className="space-y-2">
            {processes.map((proc) => (
              <div key={proc.pid} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted">
                <div>
                    <p className="font-mono text-sm">PID: {proc.pid} ({proc.user})</p>
                    <p className="font-mono truncate text-muted-foreground">{proc.command}</p>
                </div>
                <p className="font-mono text-right flex-shrink-0 ml-4">{proc.cpu}% CPU / {proc.mem}% MEM</p>
              </div>
            ))}
          </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <p>No active processes found.</p>
        </div>
      )}
    </>
  );
};

const Pm2ProcessesSection = ({ serverId, isExpanded }: { serverId: string, isExpanded: boolean }) => {
  const [processes, setProcesses] = useState<ProcessManagerInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPm2Processes(serverId);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch PM2 processes.');
    }
    setIsLoading(false);
  }, [serverId]);

  React.useEffect(() => {
    if (isExpanded && !processes) {
      fetchProcesses();
    }
  }, [isExpanded, processes, fetchProcesses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-600">Online</Badge>;
      case 'stopping':
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'launching':
        return <Badge variant="outline">Launching</Badge>;
      case 'errored':
      case 'failed':
        return <Badge variant="destructive">Errored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between p-2">
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                </div>
            ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : processes && processes.length > 0 ? (
        <div className="space-y-2">
            {processes.map((proc) => (
              <div key={proc.id} className="p-2 bg-muted/50 rounded-md hover:bg-muted">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold truncate">{proc.name}</span>
                  {getStatusBadge(proc.status)}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>{proc.cpu}% CPU / {proc.memory}</span>
                  <span>{proc.uptime} / {proc.restarts} restarts</span>
                </div>
              </div>
            ))}
          </div>
      ) : (
        <div className="text-center text-muted-foreground p-8">
          <p>No PM2 processes found or PM2 is not installed.</p>
        </div>
      )}
    </>
  );
};

const FileManagerSection = ({ serverId, isExpanded }: { serverId: string; isExpanded: boolean }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialPath = searchParams.get('fileManager') || '/';

    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState(initialPath);

    const navigate = (newPath: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('fileManager', newPath);
        router.replace(`${pathname}?${params.toString()}`);
    };
    
    const fetchFiles = useCallback(async (path: string) => {
        setIsLoading(true);
        setError(null);
        const result = await getFileList(serverId, path);
        if(result.success && result.files) {
            setFiles(result.files);
        } else {
            setError(result.error || 'Failed to list files.');
        }
        setIsLoading(false);
    }, [serverId]);
    
    React.useEffect(() => {
      const newPathFromUrl = searchParams.get('fileManager') || '/';
      if (newPathFromUrl !== currentPath) {
          setCurrentPath(newPathFromUrl);
          if (isExpanded) {
            fetchFiles(newPathFromUrl);
          }
      }
    }, [searchParams, currentPath, isExpanded, fetchFiles]);


    React.useEffect(() => {
        if (isExpanded) {
            fetchFiles(currentPath);
        }
    }, [isExpanded, currentPath, fetchFiles]);

    const handleNavigate = (file: FileInfo) => {
        if (file.type === 'd') {
            if (file.name === '..') {
                const pathParts = currentPath.split('/').filter(Boolean);
                pathParts.pop();
                const newPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
                navigate(newPath);
            } else if (file.name !== '.') {
                const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                navigate(newPath);
            }
        }
    };
    
    const handlePathChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigate((e.target as HTMLInputElement).value);
        }
    };
    
    const getFileIcon = (type: FileInfo['type']) => {
        switch(type) {
            case 'd': return <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground"/>;
            case 'l': return <LinkIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground"/>;
            default: return <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground"/>;
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input 
                  defaultValue={currentPath} 
                  onKeyDown={handlePathChange}
                  className="font-mono" 
                />
            </div>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
            ) : error ? (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                    {files.map(file => (
                        <div key={file.name} className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleNavigate(file)}>
                            {getFileIcon(file.type)}
                            <span className="font-mono flex-1 truncate">{file.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{file.size}</span>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                            <p>Directory is empty.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

interface ServerStatusAccordionProps {
    serverId: string;
}


export default function ServerStatusAccordion({ serverId }: ServerStatusAccordionProps) {
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
        <CardDescription>Real-time information fetched directly from the server. Click a section to expand.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2" value={openAccordion} onValueChange={setOpenAccordion}>
          <AccordionItem value="storage" className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:no-underline font-medium [&>svg]:rotate-0 [&>svg]:-rotate-90">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-muted-foreground" />Storage
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <Separator className="mb-4" />
              <StorageStatusSection serverId={serverId} isExpanded={openAccordion === 'storage'} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="network" className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:no-underline font-medium [&>svg]:rotate-0 [&>svg]:-rotate-90">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-muted-foreground" />Network
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <Separator className="mb-4" />
              <ActivePortsSection serverId={serverId} isExpanded={openAccordion === 'network'} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="processes" className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:no-underline font-medium [&>svg]:rotate-0 [&>svg]:-rotate-90">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-muted-foreground" />Processes
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <Separator className="mb-4" />
              <ActiveProcessesSection serverId={serverId} isExpanded={openAccordion === 'processes'} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pm2" className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:no-underline font-medium [&>svg]:rotate-0 [&>svg]:-rotate-90">
              <div className="flex items-center gap-2">
                <ListTree className="h-5 w-5 text-muted-foreground" />PM2 Processes
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <Separator className="mb-4" />
              <Pm2ProcessesSection serverId={serverId} isExpanded={openAccordion === 'pm2'} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="file-manager" className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:no-underline font-medium [&>svg]:rotate-0 [&>svg]:-rotate-90">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-muted-foreground" />File Manager
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <Separator className="mb-4" />
              <FileManagerSection serverId={serverId} isExpanded={openAccordion === 'file-manager'} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
