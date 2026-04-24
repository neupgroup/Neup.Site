

import type { CanvasElementData } from '@/schemas/canvas';
import type { Path } from '@/server/paths';
import type { Redirect } from '@/schemas/redirect';
import type { EnvironmentVariable } from '@/schemas/environment';

export interface GeneratedTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
  black: Record<string, string>;
}

export interface ArtifactTheme {
  mode?: 'light' | 'dark' | 'black';
  colors: string[];
  radius?: 'none' | 'low' | 'medium' | 'high';
  generated?: GeneratedTheme;
}

export interface ArtifactIcons {
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouch?: string;
  android192?: string;
  android512?: string;
}

export interface ProxySetting {
    path: string;
    ip: string;
    port: string;
}

export interface DomainSetting {
  url?: string;
  forceHttps?: boolean;
  proxies?: ProxySetting[];
  ignoredPaths?: string[];
}

export interface Artifact {
  id: string;
  name: string;
  url: string;
  domainSettings?: {
    production?: DomainSetting;
    development?: DomainSetting;
  };
  domains?: {
    production?: DomainSetting;
    development?: DomainSetting;
  },
  tier: 'free' | 'premium';
  logoUrl?: string;
  icons?: ArtifactIcons;
  hideSitename?: boolean;
  hideLogo?: boolean;
  description?: string;
  socialProfiles?: { platformName: string; url: string; }[];
  contactEmail?: { value: string; }[];
  contactPhone?: { value: string; }[];
  modules?: { [key: string]: any };
  theme?: ArtifactTheme;
  ownerAccountId?: string;
  status?: string;
  type?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Page {
  id: string;
  artifactId: string;
  name: string;
  elements: CanvasElementData[];
  reactComponent?: string;
  type: 'editor' | 'ai' | 'html' | 'template';
  createdAt?: string | null;
  updatedAt?: string | null;
  paths?: Path[];
}

export interface PathStructure {
  path: string;
  pageId: string;
  sections: string[];
  theme: any; // Allow for theme overrides
  changesMade: boolean;
}

export interface Structure {
  id: string;
  artifactId: string;
  structure: PathStructure[];
  status: 'deployed' | 'pendingDeployment';
  themeChanged: boolean;
  redirectsChanged: boolean;
  assetsChanged: boolean;
  appBaseChanged: boolean;
  environmentsChanged: boolean;
  updatedAt?: string | null;
}

export interface Deployment {
  id: string;
  artifactId: string;
  structure: PathStructure[];
  status: 'deployed' | 'cancelled';
  theme: ArtifactTheme;
  redirects: Omit<Redirect, 'artifactId'>[];
  siteProfile: { name: string, logoUrl?: string, hideSitename?: boolean, hideLogo?: boolean };
  environments: EnvironmentVariable[];
  attemptedOn: string | null;
}
