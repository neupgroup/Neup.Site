export interface AppBaseFile {
  name: string;
  size: string;
  type: 'internal' | 'external';
}

export interface AppBaseBackup {
  id: string;
  siteId: string;
  fileName: string;
  fileType: 'internal' | 'external';
  content: string;
  backedUpAt: string | null;
  backedUpBy: string;
}
