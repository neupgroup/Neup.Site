
export interface EnvironmentVariable {
  id: string;
  artifactId: string;
  name: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean';
  isPrivate: boolean;
  createdBy: string;
  createdOn: string | null;
}
