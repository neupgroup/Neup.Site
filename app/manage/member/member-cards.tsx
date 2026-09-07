'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, Pencil, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { appendSelectedProject } from '@/inapp/helpers/application-mode';
import { cn } from '#/core/utils';
import { useToast } from '#/core/hooks/useToast';
import type { Member } from '@/services/member/type';
import type { Team } from '@/services/team/type';
import { saveTeamBoardOrder } from '@/services/teams';

/*
::neup.documentation::manage-member-cards

::public

Client-side team-grouped member board for `/manage/member`.

It renders each team name and description as a section header, keeps members
inside their assigned team, shows a card-style empty state for teams without
members, and persists team/member ordering changes through the team service.
Drag previews are only recalculated when the active drop target changes so
native drag events do not flicker the board.

::public end
::end
*/

const UNASSIGNED_GROUP_ID = 'unassigned';

type MemberGroup = {
  id: string;
  teamId: string | null;
  name: string;
  description?: string;
  members: Member[];
};

type DragState =
  | { type: 'group'; groupId: string }
  | { type: 'member'; memberId: string; fromGroupId: string };

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function createMemberGroups(teams: Team[], members: Member[]): MemberGroup[] {
  const sortedTeams = [...teams].sort((first, second) => {
    const firstOrder = first.order ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder || first.name.localeCompare(second.name);
  });
  const sortedMembers = [...members].sort((first, second) => {
    const firstOrder = first.order ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder || first.name.localeCompare(second.name);
  });
  const groups: MemberGroup[] = sortedTeams.map((team) => ({
    id: team.id,
    teamId: team.id,
    name: team.name,
    description: team.description,
    members: [],
  }));
  const unassignedGroup: MemberGroup = {
    id: UNASSIGNED_GROUP_ID,
    teamId: null,
    name: 'Unassigned Members',
    description: 'Members without a team are shown here until they are moved.',
    members: [],
  };
  const groupMap = new Map(groups.map((group) => [group.id, group]));

  for (const member of sortedMembers) {
    const group = member.teamId ? groupMap.get(member.teamId) : unassignedGroup;
    (group ?? unassignedGroup).members.push(member);
  }

  return unassignedGroup.members.length ? [...groups, unassignedGroup] : groups;
}

function moveGroup(groups: MemberGroup[], draggedGroupId: string, targetGroupId: string) {
  const sourceIndex = groups.findIndex((group) => group.id === draggedGroupId);
  const targetIndex = groups.findIndex((group) => group.id === targetGroupId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return groups;
  }

  const nextGroups = [...groups];
  const [draggedGroup] = nextGroups.splice(sourceIndex, 1);
  nextGroups.splice(targetIndex, 0, draggedGroup);
  return nextGroups;
}

function moveMember(groups: MemberGroup[], memberId: string, fromGroupId: string, toGroupId: string, targetMemberId?: string) {
  const sourceGroup = groups.find((group) => group.id === fromGroupId);
  const targetGroup = groups.find((group) => group.id === toGroupId);
  const member = sourceGroup?.members.find((item) => item.id === memberId);

  if (!sourceGroup || !targetGroup || !member) {
    return groups;
  }

  return groups.map((group) => {
    if (group.id !== sourceGroup.id && group.id !== targetGroup.id) {
      return group;
    }

    if (sourceGroup.id === targetGroup.id) {
      const members = group.members.filter((item) => item.id !== memberId);
      const targetIndex = targetMemberId ? members.findIndex((item) => item.id === targetMemberId) : members.length;
      members.splice(targetIndex >= 0 ? targetIndex : members.length, 0, member);
      return { ...group, members };
    }

    if (group.id === sourceGroup.id) {
      return { ...group, members: group.members.filter((item) => item.id !== memberId) };
    }

    const members = [...group.members];
    const targetIndex = targetMemberId ? members.findIndex((item) => item.id === targetMemberId) : members.length;
    members.splice(targetIndex >= 0 ? targetIndex : members.length, 0, member);
    return { ...group, members };
  });
}

interface MemberCardsProps {
  initialMembers: Member[];
  initialTeams: Team[];
}

export function MemberCards({ initialMembers, initialTeams }: MemberCardsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState(() => createMemberGroups(initialTeams, initialMembers));
  const [previewGroups, setPreviewGroups] = useState<MemberGroup[] | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropGroupId, setDropGroupId] = useState<string | null>(null);
  const [dropMemberId, setDropMemberId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const selectedProject = searchParams.get('selectedProject');
  const suppressClickRef = useRef(false);
  const dragOverTargetRef = useRef<string | null>(null);

  const renderedGroups = previewGroups ?? groups;

  const persistGroups = (nextGroups: MemberGroup[], previousGroups: MemberGroup[]) => {
    startTransition(() => {
      void (async () => {
        const result = await saveTeamBoardOrder({
          teamIds: nextGroups.flatMap((group) => (group.teamId ? [group.teamId] : [])),
          groups: nextGroups.map((group) => ({
            teamId: group.teamId,
            memberIds: group.members.map((member) => member.id),
          })),
        });

        if (!result.success) {
          setGroups(previousGroups);
          toast({ variant: 'destructive', title: 'Error', description: result.error ?? 'Failed to save team order.' });
          return;
        }

        toast({ title: 'Member order saved' });
      })();
    });
  };

  const clearClickSuppression = () => {
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 150);
  };

  const resetDragState = () => {
    setDragState(null);
    setDropGroupId(null);
    setDropMemberId(null);
    setPreviewGroups(null);
    dragOverTargetRef.current = null;
    clearClickSuppression();
  };

  const shouldUpdatePreview = (targetKey: string) => {
    if (dragOverTargetRef.current === targetKey) {
      return false;
    }

    dragOverTargetRef.current = targetKey;
    return true;
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!dragState) {
      return;
    }

    const previousGroups = groups;
    const nextGroups = previewGroups ?? (dragState.type === 'group'
      ? moveGroup(groups, dragState.groupId, targetGroupId)
      : moveMember(groups, dragState.memberId, dragState.fromGroupId, targetGroupId));

    setGroups(nextGroups);
    resetDragState();
    persistGroups(nextGroups, previousGroups);
  };

  const handleMemberDrop = (targetGroupId: string, targetMemberId: string) => {
    if (!dragState || dragState.type !== 'member') {
      return;
    }

    const previousGroups = groups;
    const nextGroups = previewGroups ?? moveMember(groups, dragState.memberId, dragState.fromGroupId, targetGroupId, targetMemberId);

    setGroups(nextGroups);
    resetDragState();
    persistGroups(nextGroups, previousGroups);
  };

  return (
    <div className="grid gap-8">
      {renderedGroups.map((group) => {
        const isDraggedGroup = dragState?.type === 'group' && dragState.groupId === group.id;

        return (
          <section
            key={group.id}
            draggable={Boolean(group.teamId)}
            onDragStart={(event) => {
              if (!group.teamId) {
                event.preventDefault();
                return;
              }

              dragOverTargetRef.current = null;
              setDragState({ type: 'group', groupId: group.id });
              setPreviewGroups(groups);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!dragState) {
                return;
              }
              if (!shouldUpdatePreview(`group:${group.id}`)) {
                return;
              }

              setDropGroupId(group.id);
              setDropMemberId(null);
              setPreviewGroups(
                dragState.type === 'group'
                  ? moveGroup(groups, dragState.groupId, group.id)
                  : moveMember(groups, dragState.memberId, dragState.fromGroupId, group.id),
              );
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleGroupDrop(group.id);
            }}
            onDragEnd={resetDragState}
            className={cn(
              'grid gap-0 transition-[opacity,transform] duration-200',
              dropGroupId === group.id ? 'rounded-lg outline outline-2 outline-primary/40' : '',
              isDraggedGroup ? 'opacity-40' : '',
              isPending ? 'opacity-70' : '',
            )}
          >
            <div className="grid gap-4 rounded-t-lg border bg-muted/30 px-5 py-4 md:grid-cols-[auto_1fr_auto] md:items-start">
              <GripVertical className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <h2 className="font-headline text-lg font-semibold">{group.name}</h2>
                <p className="text-sm text-muted-foreground">{group.description || 'No description'}</p>
              </div>
              {group.teamId ? (
                <LinkButton
                  variant="plain"
                  size="icon"
                  href={appendSelectedProject(`/manage/team/${group.teamId}`, selectedProject)}
                >
                    <Pencil className="h-4 w-4" />
                  </LinkButton>
              ) : null}
            </div>

            <div className="grid gap-0">
              {group.members.map((member, index) => {
                const isDraggedMember = dragState?.type === 'member' && dragState.memberId === member.id;
                const isLast = index === group.members.length - 1;

                return (
                  <article
                    key={member.id}
                    draggable
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (suppressClickRef.current) {
                        return;
                      }

                      router.push(appendSelectedProject(`/manage/members/${member.id}`, selectedProject));
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                      }

                      event.preventDefault();
                      router.push(appendSelectedProject(`/manage/members/${member.id}`, selectedProject));
                    }}
                    onDragStart={(event) => {
                      event.stopPropagation();
                      suppressClickRef.current = true;
                      dragOverTargetRef.current = null;
                      setDragState({ type: 'member', memberId: member.id, fromGroupId: group.id });
                      setPreviewGroups(groups);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      if (!dragState || dragState.type !== 'member') {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      if (!shouldUpdatePreview(`member:${group.id}:${member.id}`)) {
                        return;
                      }

                      setDropGroupId(null);
                      setDropMemberId(member.id);
                      setPreviewGroups(moveMember(groups, dragState.memberId, dragState.fromGroupId, group.id, member.id));
                    }}
                    onDrop={(event) => {
                      if (!dragState || dragState.type !== 'member') {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      handleMemberDrop(group.id, member.id);
                    }}
                    onDragEnd={resetDragState}
                    className={cn(
                      'grid cursor-pointer gap-4 border-x border-b bg-card px-5 py-4 transition-[opacity,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing md:grid-cols-[auto_auto_1fr] md:items-center',
                      isLast ? 'rounded-b-lg' : '',
                      dropMemberId === member.id ? 'border-primary bg-primary/5' : '',
                      isDraggedMember ? 'opacity-40' : '',
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-12 w-12">
                      {member.imageUrl ? <AvatarImage src={member.imageUrl} alt={member.name} /> : null}
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </article>
                );
              })}
              {group.members.length ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!dragState || dragState.type !== 'member') {
                      return;
                    }
                    if (!shouldUpdatePreview(`group-drop:${group.id}`)) {
                      return;
                    }

                    setDropMemberId(null);
                    setDropGroupId(group.id);
                    setPreviewGroups(moveMember(groups, dragState.memberId, dragState.fromGroupId, group.id));
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleGroupDrop(group.id);
                  }}
                  className="rounded-b-lg border-x border-b border-dashed px-5 py-5 text-center text-sm text-muted-foreground"
                >
                  Drop member here to add to {group.name}
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!dragState || dragState.type !== 'member') {
                      return;
                    }
                    if (!shouldUpdatePreview(`group-drop:${group.id}`)) {
                      return;
                    }

                    setDropMemberId(null);
                    setDropGroupId(group.id);
                    setPreviewGroups(moveMember(groups, dragState.memberId, dragState.fromGroupId, group.id));
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleGroupDrop(group.id);
                  }}
                  className="grid gap-3 rounded-b-lg border-x border-b bg-card px-5 py-7 text-center text-sm text-muted-foreground"
                >
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-foreground">No employees found.</span>
                  <span>Drop a member here to add them to {group.name}.</span>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
