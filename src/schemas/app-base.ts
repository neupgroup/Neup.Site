export interface AppBaseBackup {
  id: string;
  siteId: string;
  fileName: string;
  content: string;
  backedUpAt: string | null;
  backedUpBy: string;
}
