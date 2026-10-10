'use client';

import { Link } from '@neup/components/ui/link';
import { ChevronRight, Image, Share2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { appendProject } from '@/inapp/helpers/application-mode';
import IdentityEditor from '@/components/identity-editor';

const sections = [
  {
    title: 'Branding Assets',
    description: 'Manage your logo and site icons.',
    href: '/identity/assets',
    icon: Image,
  },
  {
    title: 'Socials and Connections',
    description: 'Manage social media links and phone numbers.',
    href: '/identity/connections',
    icon: Share2,
  },
];

export default function IdentityPage() {
  const searchParams = useSearchParams();
  const project = searchParams.get('project');

  return (
    <div className="space-y-10">
      <IdentityEditor section="identity" />
      <section className="w-full space-y-4" aria-label="More identity changes">
        <div>
          <h2 className="font-headline text-xl font-semibold">Make more changes</h2>
          <p className="text-sm text-muted-foreground">Manage your branding assets, social links, and contact details.</p>
        </div>
        <div className="space-y-0">
          {sections.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={appendProject(href, project)}
              className="flex w-full items-center justify-between gap-4 border border-b-0 p-4 transition-colors first:rounded-t-md last:rounded-b-md last:border-b hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold">{title}</div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
