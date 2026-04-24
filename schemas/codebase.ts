
export interface CodeFile {
  id: string;
  artifactId: string;
  fileName: string;
  filePath: string;
  content: string; // base64
  size: number;
  createdAt: string | null;
}
