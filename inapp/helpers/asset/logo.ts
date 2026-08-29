/*
::neup.documentation::inapp-helper-asset-logo
::title Asset Logo Helper

Shared asset-logo helpers for resolving themed logo URLs and detecting SVG
responses across app, service, and component layers.

::public

`resolveAssetLogoUrl()` returns a normalized logo URL. SVG logos are routed
through `/bridge/api.v1/asset/logo` when theme colors are available so the
shared Neup palette can be recolored per asset theme.

`isResolvedAssetLogoSvg()` detects both direct `.svg` URLs and themed bridge
URLs that proxy an underlying SVG source.

::public end
::end
*/

import { normalizeUrl } from '#/core/helpers/link/url';

type GeneratedThemeSurface = {
  primary?: string;
  accent?: string;
  secondary?: string;
  background?: string;
};

type AssetLogoTheme = {
  mode?: 'light' | 'dark' | 'black';
  colors?: string[];
  generated?: Partial<Record<'light' | 'dark' | 'black', GeneratedThemeSurface>>;
};

type ThemeMode = NonNullable<AssetLogoTheme['mode']>;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isHexColor(value: string | null | undefined): value is string {
  return !!value && HEX_COLOR_PATTERN.test(value);
}

function parseHslValue(value: string): { h: number; s: number; l: number } | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function hslToHex(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsed = parseHslValue(value);
  if (!parsed) return null;

  const h = ((parsed.h % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, parsed.s)) / 100;
  const l = Math.max(0, Math.min(100, parsed.l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function resolveThemeMode(theme?: AssetLogoTheme): ThemeMode {
  switch (theme?.mode) {
    case 'dark':
    case 'black':
      return theme.mode;
    default:
      return 'light';
  }
}

function resolveThemeColors(theme?: AssetLogoTheme): { primary: string; background: string; tint: string } | null {
  const mode = resolveThemeMode(theme);
  const generated = theme?.generated?.[mode];

  const primary =
    (isHexColor(theme?.colors?.[0]) ? theme.colors[0] : null) ??
    hslToHex(generated?.primary) ??
    hslToHex(generated?.accent);
  const background = hslToHex(generated?.background);
  const tint = hslToHex(generated?.secondary) ?? primary;

  if (!primary || !background || !tint) {
    return null;
  }

  return { primary, background, tint };
}

function getSvgSourcePath(value: string): string | null {
  try {
    const url = new URL(value, 'https://asset.local');
    const nestedUrl = url.searchParams.get('url');
    if (nestedUrl) {
      return getSvgSourcePath(nestedUrl);
    }

    return url.pathname.toLowerCase();
  } catch {
    return null;
  }
}

export function isResolvedAssetLogoSvg(value: string | null | undefined): boolean {
  if (!value) return false;
  const sourcePath = getSvgSourcePath(value);
  return !!sourcePath && sourcePath.endsWith('.svg');
}

export function resolveAssetLogoUrl(value: string | null | undefined, theme?: AssetLogoTheme): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalizedUrl = normalizeUrl(value);
  if (!normalizedUrl) {
    return null;
  }

  if (!isResolvedAssetLogoSvg(normalizedUrl)) {
    return normalizedUrl;
  }

  const colors = resolveThemeColors(theme);
  if (!colors) {
    return normalizedUrl;
  }

  const params = new URLSearchParams({
    url: normalizedUrl,
    primary: colors.primary,
    background: colors.background,
    tint: colors.tint,
  });

  return `/bridge/api.v1/asset/logo?${params.toString()}`;
}
