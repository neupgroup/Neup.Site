
/*
::neup.documentation::member-schema

::public

Type contract for a member record and its assigned team identifier.

::public end
::end
*/

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  teamId?: string;
  order?: number;
  permissions?: string[];
}
