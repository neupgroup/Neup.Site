

export interface ServerAllocation {
  id: string;
  siteId: string;
  serverId: string;
  username?: string;
  deploymentPath?: string;
  allocatedPorts?: number[];
  allocatedOn?: string | null;
  expiresOn?: string | null;
}

export interface Server {
  id: string;
  name: string;
  publicIp: string;
  privateIp?: string;
  privateKey?: string;
  createdOn?: string | null;
  expiresOn?: string | null;
}
