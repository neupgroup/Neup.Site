
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSite, type SiteTheme } from '@/actions/editor/site';

const SESSION_STORAGE_KEY_NAME = 'profileName';
const SESSION_STORAGE_KEY_LOGO = 'logoUrl';
const SESSION_STORAGE_KEY_HIDE_SITENAME = 'hideSitename';
const SESSION_STORAGE_KEY_HIDE_LOGO = 'hideLogo';
const SESSION_STORAGE_KEY_THEME = 'siteTheme';

interface ProfileContextType {
  profileName: string | null;
  setProfileName: Dispatch<SetStateAction<string | null>>;
  logoUrl: string | null;
  setLogoUrl: Dispatch<SetStateAction<string | null>>;
  hideSitename: boolean | null;
  setHideSitename: Dispatch<SetStateAction<boolean | null>>;
  hideLogo: boolean | null;
  setHideLogo: Dispatch<SetStateAction<boolean | null>>;
  theme: SiteTheme | null;
  setTheme: Dispatch<SetStateAction<SiteTheme | null>>;
  loading: { name: boolean, logo: boolean, hideSitename: boolean, hideLogo: boolean, theme: boolean };
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hideSitename, setHideSitename] = useState<boolean | null>(null);
  const [hideLogo, setHideLogo] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [loading, setLoading] = useState({ name: true, logo: true, hideSitename: true, hideLogo: true, theme: true });

  useEffect(() => {
    async function initializeProfile() {
      setLoading({ name: true, logo: true, hideSitename: true, hideLogo: true, theme: true });
      
      const cachedName = sessionStorage.getItem(SESSION_STORAGE_KEY_NAME);
      const cachedLogo = sessionStorage.getItem(SESSION_STORAGE_KEY_LOGO);
      const cachedHideSitename = sessionStorage.getItem(SESSION_STORAGE_KEY_HIDE_SITENAME);
      const cachedHideLogo = sessionStorage.getItem(SESSION_STORAGE_KEY_HIDE_LOGO);
      const cachedTheme = sessionStorage.getItem(SESSION_STORAGE_KEY_THEME);
      
      let needsFetch = false;

      if (cachedName) setProfileName(cachedName); else needsFetch = true;
      if (cachedLogo) setLogoUrl(cachedLogo); else needsFetch = true;
      if (cachedHideSitename) setHideSitename(cachedHideSitename === 'true'); else needsFetch = true;
      if (cachedHideLogo) setHideLogo(cachedHideLogo === 'true'); else needsFetch = true;
      if (cachedTheme) setTheme(JSON.parse(cachedTheme)); else needsFetch = true;

      if (needsFetch) {
        const { success, site } = await getSite();

        if (success && site) {
            if (!cachedName) {
                const finalName = site.name?.trim() ? site.name : 'Neup.Sites';
                setProfileName(finalName);
                sessionStorage.setItem(SESSION_STORAGE_KEY_NAME, finalName);
            }
            if (!cachedLogo) {
                const finalLogo = site.logoUrl || null;
                setLogoUrl(finalLogo);
                if (finalLogo) sessionStorage.setItem(SESSION_STORAGE_KEY_LOGO, finalLogo);
            }
            if (!cachedHideSitename) {
                const finalHideSitename = site.hideSitename || false;
                setHideSitename(finalHideSitename);
                sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_SITENAME, String(finalHideSitename));
            }
            if (!cachedHideLogo) {
                const finalHideLogo = site.hideLogo || false;
                setHideLogo(finalHideLogo);
                sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_LOGO, String(finalHideLogo));
            }
            if (!cachedTheme && site.theme) {
                setTheme(site.theme);
                sessionStorage.setItem(SESSION_STORAGE_KEY_THEME, JSON.stringify(site.theme));
            }
        }
      }
      setLoading({ name: false, logo: false, hideSitename: false, hideLogo: false, theme: false });
    }
    initializeProfile();
  }, []);

  useEffect(() => {
    if (profileName && profileName !== 'Neup.Sites') sessionStorage.setItem(SESSION_STORAGE_KEY_NAME, profileName);
    else if (profileName === null) sessionStorage.removeItem(SESSION_STORAGE_KEY_NAME);
  }, [profileName]);

  useEffect(() => {
    if (logoUrl) sessionStorage.setItem(SESSION_STORAGE_KEY_LOGO, logoUrl);
    else sessionStorage.removeItem(SESSION_STORAGE_KEY_LOGO);
  }, [logoUrl]);

  useEffect(() => {
    if (hideSitename !== null) sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_SITENAME, String(hideSitename));
  }, [hideSitename]);

  useEffect(() => {
    if (hideLogo !== null) sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_LOGO, String(hideLogo));
  }, [hideLogo]);

  useEffect(() => {
    if (theme) sessionStorage.setItem(SESSION_STORAGE_KEY_THEME, JSON.stringify(theme));
    else sessionStorage.removeItem(SESSION_STORAGE_KEY_THEME);
  }, [theme]);

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName, logoUrl, setLogoUrl, hideSitename, setHideSitename, hideLogo, setHideLogo, theme, setTheme, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
