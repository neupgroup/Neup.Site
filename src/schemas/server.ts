

export interface ServerAllocation {
  siteId: string;
  port: number;
}

export interface Server {
  id: string;
  name: string;
  publicIp: string;
  privateIp?: string;
  privateKey?: string;
  createdAt?: string | null;
  type: 'shared' | 'private';
  allocations?: ServerAllocation[];
}
