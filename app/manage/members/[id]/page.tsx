import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from "@neup/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { generatePageMetadata } from '@neup/core/helpers/metadata';
import { getMember } from '@/services/members';
import { appendProject } from '@/inapp/helpers/application-mode';

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
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = query.project?.trim() || null;
  const { member, error } = await getMember(id);

  if (error || !member) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <LinkButton variant="outlined" href={appendProject('/manage/member', project)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </LinkButton>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16 bg-primary/10">
            {member.imageUrl ? <AvatarImage className="visible object-cover" src={member.imageUrl} alt={member.name} /> : null}
            {!member.imageUrl ? <AvatarFallback>{getInitials(member.name)}</AvatarFallback> : null}
          </Avatar>
          <div className="min-w-0">
            <CardTitle>{member.name}</CardTitle>
            <CardDescription>{member.role}</CardDescription>
          </div>
        </CardHeader>
          <CardContent className="space-y-4">
          <LinkButton variant="solid" href={appendProject(`/manage/members/${member.id}/edit`, project)}>
            Edit Member
          </LinkButton>
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
