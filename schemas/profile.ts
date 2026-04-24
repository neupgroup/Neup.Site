

export interface SocialProfile {
  platformName: string;
  url: string;
}

export interface Profile {
  id: string;
  name: string;
  logoUrl?: string;
  hideSitename?: boolean; // Added this
  hideLogo?: boolean; // Added this
  description?: string;
  socialProfiles: SocialProfile[];
  contactEmail: { value: string; }[];
  contactPhone: { value: string; }[];
  updatedAt?: string | null;
}
