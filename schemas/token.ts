
export interface ApiToken {
  id: string;
  accountId: string;
  name: string;
  token: string; // This will now represent the prefix
  tokenHash: string;
  tokenPrefix: string;
  createdAt: string | null;
  lastUsed?: string | null;
}
