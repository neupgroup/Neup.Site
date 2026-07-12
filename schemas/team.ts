
/*
::neup.documentation::team-schema

::public

Type contract for a team record used by services and management UIs.

::public end
::end
*/

export interface Team {
  id: string;
  name: string;
  description?: string;
  order?: number;
}
