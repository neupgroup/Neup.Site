
/*
::neup.documentation::service-team-type

::public

Type contract for a team record used by services and management UIs.

::public end
::end
*/

export interface Team {
  id: string;
  assetId?: string;
  name: string;
  description?: string;
  order?: number;
}
