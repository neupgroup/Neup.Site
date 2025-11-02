
'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Users, Repeat, Power, Loader2, PlayCircle, StopCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/actions/runner';
import { useState, useTransition, useEffect } from 'react';
import { getSiteServers } from '@/actions/servers';
import type { Server } from '@/schemas/server';
import { getPm2Processes } from '@/actions/server/management/get-pm2-processes';
import { useProfile } from '@/context/ProfileContext';

const AppStatusCard = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { site } = useProfile();
    const [servers, setServers] = useState<(Server & { allocation: any })[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<string>('');
    const [appMode, setAppMode] = useState<'production' | 'development'>('production');
    const [appStatus, setAppStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown');
    const [isStatusLoading, setIsStatusLoading] = useState(false);

    useEffect(() => {
      const fetchServers = async () => {
        const result = await getSiteServers();
        if (result.success && result.servers) {
          setServers(result.servers);
          if (result.servers.length > 0) {
            setSelectedServerId(result.servers[0].id);
          }
        }
      };
      fetchServers();
    }, []);

    useEffect(() => {
        if (!selectedServerId || !site) return;

        const checkStatus = async () => {
            setIsStatusLoading(true);
            const res = await getPm2Processes(selectedServerId);
            if (res.success && res.processes) {
                const processName = `${site.id}.${appMode}`;
                const runningProcess = res.processes.find(p => p.name.startsWith(processName) && p.status === 'online');
                setAppStatus(runningProcess ? 'running' : 'stopped');
            } else {
                setAppStatus('unknown');
            }
            setIsStatusLoading(false);
        };
        checkStatus();
    }, [selectedServerId, appMode, site]);


    const handleStart = () => {
        if (!selectedServerId) {
            toast({ variant: 'destructive', title: 'No server selected' });
            return;
        }
        startTransition(async () => {
            toast({ title: "Starting Application...", description: "This process may take several minutes."});
            // This will be a new, complex command for the whole process
            await runCommand(selectedServerId, "app-start-prod"); 
        });
    };
    
    const handleStop = () => {
         if (!selectedServerId || !site) return;
         startTransition(async () => {
            toast({ title: "Stopping Application..."});
            const processName = `${site.id}.${appMode}`;
            await runCommand(selectedServerId, `pm2 stop ${processName} && pm2 delete ${processName} && pm2 save`);
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Start or stop your application on the server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Server</Label>
                    <Select value={selectedServerId} onValueChange={setSelectedServerId}>
                        <SelectTrigger><SelectValue placeholder="Select a server..." /></SelectTrigger>
                        <SelectContent>
                            {servers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.publicIp})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={appMode} onValueChange={(v) => setAppMode(v as any)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2">
                    <Label>Status:</Label>
                    {isStatusLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <span className="text-sm font-semibold capitalize">{appStatus}</span>}
                </div>
            </CardContent>
            <CardFooter>
                 {appStatus === 'running' ? (
                     <Button variant="destructive" onClick={handleStop} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2"/> : <StopCircle className="mr-2" />}
                        Stop Application
                    </Button>
                ) : (
                    <Button onClick={handleStart} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2"/> : <PlayCircle className="mr-2" />}
                        Start Application
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};


export default function SettingsPage() {
  const settingsOptions = [
    {
      title: 'Switch Account',
      description: 'Switch to a different site or profile.',
      icon: <Repeat className="h-6 w-6 text-primary" />,
      href: '/settings/switch',
    },
    {
      title: 'Accounts',
      description: 'Manage your linked accounts like GitHub.',
      icon: <Users className="h-6 w-6 text-primary" />,
      href: '/settings/accounts',
    },
  ];

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsOptions.map((option) => (
          <Link key={option.title} href={option.href} className="group block">
            <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardHeader>
            </Card>
          </Link>
        ))}
         <AppStatusCard />
      </div>
    </div>
  );
}
