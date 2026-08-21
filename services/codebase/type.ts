
export interface CodeFile {
  id: string;
  assetId: string;
  fileName: string;
  filePath: string;
  content: string; // base64
  size: number;
  createdAt: string | null;
}

export interface CodebaseDirectoryEntry {
  name: string;
  path: string;
  fileCount: number;
  totalSize: number;
}

export interface CodebaseFileEntry {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: string | null;
}

export interface CodebaseBreadcrumb {
  name: string;
  path: string | null;
}

export interface CodebaseSelectedFile extends CodebaseFileEntry {
  content: string;
}

export interface CodebaseBrowserData {
  currentPath: string | null;
  parentPath: string | null;
  breadcrumbs: CodebaseBreadcrumb[];
  directories: CodebaseDirectoryEntry[];
  files: CodebaseFileEntry[];
  totalFileCount: number;
  selectedFile?: CodebaseSelectedFile;
}
