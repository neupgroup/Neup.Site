
export interface CodeFile {
  id: string;
  siteId: string;
  fileName: string;
  filePath: string;
  content: string; // base64
  size: number;
  createdAt: string | null;
}
