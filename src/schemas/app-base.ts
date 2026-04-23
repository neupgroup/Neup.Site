
export interface AppBaseFile {
  name: string;
  size: string;
  type: 'internal' | 'external';
  status: 'created' | 'template';
}

export interface AppBaseBackup {
  id: string;
  artifactId: string;
  fileName: string;
  fileType: 'internal' | 'external';
  content: string;
  backedUpAt: string | null;
  backedUpBy: string;
}
