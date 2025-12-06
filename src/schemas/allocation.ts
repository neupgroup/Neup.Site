
export interface Allocation {
  id: string;
  serverId: string;
  siteId: string;
  port: number;
  allocatedStorage: number; // in MB
  allocatedOn: string | null;
  status: 'active' | 'inactive' | 'pending' | 'error';
}
