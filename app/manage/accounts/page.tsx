import { Shield, Users } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { getPlatformAccounts } from '@/services/accounts';

/*
::neup.documentation::manage-accounts-page

::public

Accounts overview page for `/manage/accounts`.

It lists the account records stored in this platform.

::public end
::end
*/

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Accounts',
  });
}

function getInitials(name: string, fallback: string) {
  const source = name.trim() || fallback.trim() || 'A';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A';
}

export default async function ManageAccountsPage() {
  const { accounts, error } = await getPlatformAccounts();
  const platformAccounts = accounts ?? [];
  const totalAccounts = platformAccounts.length;
  const totalRoles = platformAccounts.reduce((sum, account) => sum + account.roleCount, 0);

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">Review the account records that currently exist in this platform.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Total accounts</CardDescription>
              <CardTitle className="mt-2 text-3xl">{totalAccounts}</CardTitle>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Total assigned roles</CardDescription>
              <CardTitle className="mt-2 text-3xl">{totalRoles}</CardTitle>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </section>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <Shield className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">Could not load accounts.</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : !platformAccounts.length ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">No accounts found.</p>
              <p className="mt-1 text-sm">No account records have been created in this platform yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Account Directory</h2>
            <p className="text-sm text-muted-foreground">Each card represents an account record stored in this platform.</p>
          </div>
          <div className="space-y-0">
            {platformAccounts.map((account, index) => {
              const isFirst = index === 0;
              const isLast = index === platformAccounts.length - 1;

              return (
                <Link
                  key={account.id}
                  href={`/manage/accounts/${account.id}`}
                  className={[
                    'block w-full border p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isFirst ? 'rounded-t-md' : 'rounded-t-none',
                    isLast ? 'rounded-b-md' : 'rounded-b-none border-b',
                    !isLast ? 'border-b-0' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-[1.25rem]">
                      {account.displayImage ? <AvatarImage src={account.displayImage} alt={account.displayName || account.id} /> : null}
                      <AvatarFallback>{getInitials(account.displayName, account.id)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="text-base font-semibold">{account.displayName || account.id}</p>
                      <p className="text-sm text-muted-foreground">{account.neupId || 'No NeupID'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
