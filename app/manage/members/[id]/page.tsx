import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { generatePageMetadata } from '#/core/helpers/metadata';
import { getMember } from '@/services/members';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';

/*
::neup.documentation::manage-member-detail-page

::public

Member detail page for `/manage/members/[id]`.

It returns a 404 when the member does not exist for the active asset and shows
the member's stored profile fields.

::public end
::end
*/

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { member } = await getMember(id);
  return generatePageMetadata({
    title: member?.name || 'Member',
    prefix: 'Member',
    titleKind: 'prefix-title',
    prefixSeparator: ': ',
  });
}

export default async function ViewMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selectedProject?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const selectedProject = query.selectedProject?.trim() || null;
  const { member, error } = await getMember(id);

  if (error || !member) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <LinkButton variant="outlined" href={appendSelectedProject('/manage/member', selectedProject)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </LinkButton>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            {member.imageUrl ? <AvatarImage src={member.imageUrl} alt={member.name} /> : null}
            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle>{member.name}</CardTitle>
            <CardDescription>{member.role}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </div>
            <div className="text-muted-foreground">{member.email}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
