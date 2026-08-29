import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, Globe } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { getPlatformAccount } from '@/services/accounts';

/*
::neup.documentation::manage-account-detail-page

::public

Account detail page for `/manage/accounts/[id]`.

It returns a 404 when the account does not exist and summarizes the account's
record, access footprint, and connected resources.

::public end
::end
*/

function getInitials(name: string, fallback: string) {
  const source = name.trim() || fallback.trim() || 'A';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined, fallback: string) {
  if (!value?.trim()) {
    return fallback;
  }

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account } = await getPlatformAccount(id);

  return generatePageMetadata({
    title: account?.displayName || account?.id || 'Account',
    prefix: 'Account',
    titleKind: 'prefix-title',
    prefixSeparator: ': ',
  });
}

export default async function ManageAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, error } = await getPlatformAccount(id);

  if (error || !account) {
    notFound();
  }

  const accountName = account.displayName || account.id;
  const prettyDetails = account.moreDetails ? JSON.stringify(account.moreDetails, null, 2) : null;

  return (
    <div className="w-full space-y-8">
      <div>
        <Button type="outlined" asChild>
          <Link href="/manage/accounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Link>
        </Button>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-[1.5rem]">
            {account.displayImage ? <AvatarImage src={account.displayImage} alt={accountName} /> : null}
            <AvatarFallback>{getInitials(account.displayName, account.id)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{accountName}</h1>
              <p className="text-sm text-muted-foreground">{account.neupId || account.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{formatLabel(account.type, 'Unknown type')}</Badge>
              <Badge variant="outline">{formatLabel(account.status, 'Unknown status')}</Badge>
            </div>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Created</div>
          <div className="font-medium">{formatDate(account.createdOn)}</div>
        </div>
      </header>

      <section className="grid gap-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">More Details</h2>
            <p className="text-sm text-muted-foreground">Raw structured details stored on the account record.</p>
          </div>
          {prettyDetails ? (
            <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 text-xs leading-6">{prettyDetails}</pre>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No additional structured details are stored for this account.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold leading-none tracking-tight">Site Access</h2>
          <p className="text-sm text-muted-foreground">Sites this account can access through direct role assignments.</p>
        </div>
        {!account.sites.length ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            This account does not currently have access to any sites.
          </div>
        ) : (
          <div className="space-y-0">
            {account.sites.map((site, index) => {
              const isFirst = index === 0;
              const isLast = index === account.sites.length - 1;

              return (
                <div
                  key={site.assetId}
                  className={[
                    'w-full border p-4',
                    isFirst ? 'rounded-t-md' : 'rounded-t-none',
                    isLast ? 'rounded-b-md' : 'rounded-b-none',
                    !isLast ? 'border-b-0' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold">{site.assetName}</div>
                          <div className="text-sm leading-tight text-muted-foreground">
                            Roles: {site.roles.map((role) => formatLabel(role, role)).join(', ')}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {site.isOwner ? <Badge>Owner</Badge> : null}
                          {site.assetType ? <Badge variant="outline">{formatLabel(site.assetType, 'Unknown type')}</Badge> : null}
                          {site.assetStatus ? <Badge variant="outline">{formatLabel(site.assetStatus, 'Unknown status')}</Badge> : null}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
