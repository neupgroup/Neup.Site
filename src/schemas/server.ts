

export interface ServerAllocationStorage {
  totalStorage: string;
  availableStorage: string;
  systemStorage: string;
  codebaseStorage: string;
  assetsStorage: string;
  unit: string;
}

export interface ServerAllocation {
  id: string;
  artifactId: string;
  serverId: string;
  username?: string;
  deploymentPath?: string;
  storageAllocation: string; // e.g., "1024" for 1024MB
  port?: number;
  allocatedOn?: string | null;
}

export interface UsedPort {
  port: number;
  description: string;
}

export interface Server {
  id: string;
  name: string;
  publicIp: string;
  privateIp?: string;
  privateKey?: string;
  serverType?: 'vps' | 'dedicated' | 'cloud';
  platform?: 'ubuntu' | 'windows';
  provider?: string;
  isPrivate?: boolean;
  username?: string;
  basePath?: string;
  appPath?: string;
  storageUsed?: string;
  storageTotal?: string;
  storageUnit?: string;
  portsOpen?: UsedPort[];
  usedPorts?: UsedPort[];
  serverConfigured?: boolean;
  defaultNginxConfigStatus?: 'configured' | 'not-configured' | 'cancelled' | 'ongoing';
  createdOn?: string | null;
  expiresOn?: string | null;
}

export interface ServerLog {
  id: string;
  serverId: string;
  commandId?: string;
  commandName?: string;
  command: string;
  output: string;
  status: 'pending' | 'ongoing' | 'completed' | 'failed' | 'cancelled';
  initiatedBy: string;
  initiatedAt: string | null;
  completedAt?: string | null;
}
