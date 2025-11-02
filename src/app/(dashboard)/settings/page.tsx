
'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Users, Repeat, Power, Loader2, PlayCircle, StopCircle, Settings, Rocket } from 'lucide-react';
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
    {
        title: 'Application Control',
        description: 'Start or stop your application on a server.',
        icon: <Power className="h-6 w-6 text-primary" />,
        href: '/settings/start',
    }
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
      </div>
    </div>
  );
}
