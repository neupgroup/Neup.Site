
export interface ApiToken {
  id: string;
  accountId: string;
  name: string;
  token: string;
  createdAt: string | null;
  lastUsed?: string | null;
}
