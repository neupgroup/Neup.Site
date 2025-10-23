
export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  teamIds?: string[];
  permissions?: string[];
}
