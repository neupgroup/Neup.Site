import { Globe, Shield, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Badge } from '#/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { getAccessOverview } from '@/services/access';

/*
::neup.documentation::manage-access-page

::public

Access overview page for `/manage/access`.

It shows which user accounts can access which managed sites and summarizes the
same relationships by site.

::public end
::end
*/

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Access',
  });
}

export default async function ManageAccessPage() {
  const { success, users, sites, error } = await getAccessOverview();
  const totalUsers = users?.length ?? 0;
  const totalSites = sites?.length ?? 0;

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Access</h1>
        <p className="text-sm text-muted-foreground">Review which user accounts can access which sites across the properties you manage.</p>
      </header>

      {!success ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? 'Failed to load access information.'}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Users with access</CardDescription>
              <CardTitle className="mt-2 text-3xl">{totalUsers}</CardTitle>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Managed sites</CardDescription>
              <CardTitle className="mt-2 text-3xl">{totalSites}</CardTitle>
            </div>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Access relationships</CardDescription>
              <CardTitle className="mt-2 text-3xl">
                {users?.reduce((sum, user) => sum + user.totalSites, 0) ?? 0}
              </CardTitle>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </section>

      {!success || (!totalUsers && !totalSites) ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <Shield className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">No access records found.</p>
              <p className="mt-1 text-sm">Add user roles to one or more sites to populate this page.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>User Access Matrix</CardTitle>
              <CardDescription>Each row shows the sites available to a specific user account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead className="w-32 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.accountId}>
                      <TableCell className="align-top">
                        <div className="font-medium">{user.accountId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.sites.map((site) => (
                            <div key={`${user.accountId}-${site.assetId}`} className="rounded-md border px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{site.assetName}</span>
                                {site.isCurrentAsset ? <Badge variant="secondary">Current Site</Badge> : null}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {site.roles.map((role) => (
                                  <Badge key={`${site.assetId}-${role}`} variant="outline">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{user.totalSites}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Access Summary</CardTitle>
              <CardDescription>Each site lists the user accounts that currently have access to it.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {sites?.map((site) => (
                <div key={site.assetId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{site.assetName}</h2>
                    {site.isCurrentAsset ? <Badge variant="secondary">Current Site</Badge> : null}
                    <Badge variant="outline">{site.totalUsers} users</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {site.users.map((user) => (
                      <div key={`${site.assetId}-${user.accountId}`} className="rounded-md bg-muted/40 px-3 py-2">
                        <div className="font-medium">{user.accountId}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <Badge key={`${site.assetId}-${user.accountId}-${role}`} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
