
'use client'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Users, Repeat, Network, User } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

export default function SettingsPage() {
  usePageTitle('Settings');

  const settingsOptions = [
    {
      title: 'Profile',
      description: 'Manage your site profile and contact information.',
      icon: <User className="h-6 w-6 text-primary" />,
      href: '/settings/profile',
    },
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
      title: 'Domains',
      description: 'Manage your site domains and subdomains.',
      icon: <Network className="h-6 w-6 text-primary" />,
      href: '/settings/domain',
    },
  ];

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
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
