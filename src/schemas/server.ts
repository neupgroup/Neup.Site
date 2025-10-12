
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
  serverType?: 'vps' | 'dedicated' | 'cloud';
  provider?: string;
  portsOpen?: number[];
  isPrivate?: boolean;
  createdOn?: string | null;
  expiresOn?: string | null;
}

export interface ServerLog {
  id: string;
  serverId: string;
  command: string;
  output: string;
  status: 'pending' | 'ongoing' | 'completed' | 'failed' | 'cancelled';
  initiatedBy: string;
  initiatedAt: string | null;
  completedAt?: string | null;
}
