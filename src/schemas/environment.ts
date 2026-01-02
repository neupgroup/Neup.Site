
export interface EnvironmentVariable {
  id: string;
  siteId: string;
  name: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean';
  isPrivate: boolean;
  createdBy: string;
  createdOn: string | null;
}
