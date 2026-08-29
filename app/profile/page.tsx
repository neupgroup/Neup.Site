'use client';

/*
::neup.documentation::manage-user-profile-page

::public

Dedicated `/profile` route for the signed-in user account. Shows the current
user's basic account identity without redirecting into asset profile editing.

::public end
::end
*/

import { useEffect, useState } from 'react';
import { AlertCircle, ChevronRight, KeyRound, Pencil, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Skeleton } from '#/components/ui/skeleton';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { getSelfAccountBasics, type SelfAccountBasics } from '@/services/accounts';

function getInitials(displayName: string | null, neupid: string | null) {
  return (displayName || neupid || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A';
}

export default function UserProfilePage() {
  usePageTitle('My Profile');

  const [accountBasics, setAccountBasics] = useState<SelfAccountBasics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccountBasics() {
      const result = await getSelfAccountBasics();
      if (!active) return;

      if (result.error) {
        setError(result.error);
        setAccountBasics(null);
        setLoading(false);
        return;
      }

      setAccountBasics(result.basics ?? null);
      setLoading(false);
    }

    loadAccountBasics();

    return () => {
      active = false;
    };
  }, []);

  const displayName = accountBasics?.displayName?.trim() || null;
  const neupid = accountBasics?.neupid?.trim() || null;
  const displayImage = accountBasics?.displayImage?.trim() || null;
  const initials = getInitials(displayName, neupid);

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Information for the account currently signed in to this workspace.</p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load your profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {loading ? (
          <Skeleton className="h-24 w-24 rounded-lg" />
        ) : (
          <Link
            href="https://neupgroup.com/account/profile/display"
            target="_blank"
            rel="noreferrer"
            className="group relative block h-24 w-24 overflow-hidden rounded-lg border border-border/60 bg-muted/30"
            aria-label="Edit profile image"
          >
            <Avatar className="h-full w-full rounded-none">
              {displayImage ? <AvatarImage src={displayImage} alt={displayName || neupid || 'Account'} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" /> : null}
              <AvatarFallback className="rounded-none text-2xl font-semibold transition duration-200 group-hover:scale-105">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/35">
              <span className="flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-background/95 text-foreground opacity-0 shadow-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <Pencil className="h-4 w-4" />
              </span>
            </div>
          </Link>
        )}

        <div className="min-w-0 space-y-2">
          {loading ? (
            <>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-6 w-40" />
            </>
          ) : (
            <>
              <div className="text-3xl font-semibold leading-none text-foreground">
                {displayName || 'Unnamed account'}
              </div>
              <div className="text-base leading-none text-muted-foreground">
                {neupid ? `@${neupid}` : 'No NeupID available'}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-0">
        <Link
          href="https://neupgroup.com/account/profile"
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-t-md rounded-b-none border border-b-0 p-4 transition-colors hover:bg-muted/90"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold">Update your profile</h2>
                <p className="text-sm text-muted-foreground">Open your Neup account settings to update your profile details.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </Link>

        <Link
          href="https://neupgroup.com/account/security/password"
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-t-none rounded-b-md border p-4 transition-colors hover:bg-muted/90"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold">Change your password</h2>
                <p className="text-sm text-muted-foreground">Open your Neup account settings to update your password.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </Link>
      </div>

    </div>
  );
}
