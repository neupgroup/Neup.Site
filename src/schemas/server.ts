export interface Server {
  id: string;
  name: string;
  publicIp: string;
  privateIp?: string; // Not fetched for display
  publicKey: string;
  privateKey?: string; // Not fetched for display
  createdAt?: string | null;
}
