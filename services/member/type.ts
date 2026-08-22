
/*
::neup.documentation::service-member-type

::public

Type contract for a member record and its assigned team identifier.

::public end
::end
*/

export interface Member {
  id: string;
  assetId?: string;
  slug?: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  teamId?: string;
  order?: number;
  permissions?: string[];
}
