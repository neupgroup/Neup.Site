type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function getContrastColor(hsl: HSL): HSL {
  // Simple contrast based on lightness threshold
  return hsl.l > 60 ? { h: 0, s: 0, l: 10 } : { h: 0, s: 0, l: 98 };
}

function hslToString(hsl: HSL): string {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
}

function adjustForDarkMode(hsl: HSL): HSL {
  return {
    h: hsl.h,
    s: Math.min(100, hsl.s * 1.2), // boost saturation
    l: Math.max(20, hsl.l * 0.6),  // lower lightness but not too much
  };
}

function generateSecondaryColor(hsl: HSL): HSL {
  // Slight hue shift for a natural secondary tone
  return {
    h: (hsl.h + 20) % 360,
    s: Math.min(100, hsl.s * 0.8),
    l: Math.min(70, hsl.l + 10),
  };
}

export function generateThemeFromColor(hexColors: string[]) {
  if (!hexColors || hexColors.length === 0) {
    hexColors = ['#64C5CF', '#2A9D8F'];
  }

  const primaryRgb = hexToRgb(hexColors[0]);
  const accentRgb = hexToRgb(hexColors[1] || hexColors[0]);

  if (!primaryRgb || !accentRgb) {
    throw new Error('Invalid HEX color format');
  }

  const primaryHsl = rgbToHsl(primaryRgb);
  const accentHsl = rgbToHsl(accentRgb);

  // Dark mode adjusted tones
  const primaryDark = adjustForDarkMode(primaryHsl);
  const accentDark = adjustForDarkMode(accentHsl);
  const secondaryDark = adjustForDarkMode(generateSecondaryColor(primaryHsl));

  const lightTheme = {
    background: '210 20% 98%',
    foreground: '240 10% 3.9%',
    card: '0 0% 100%',
    cardForeground: '240 10% 3.9%',
    popover: '0 0% 100%',
    popoverForeground: '240 10% 3.9%',
    primary: hslToString(primaryHsl),
    primaryForeground: hslToString(getContrastColor(primaryHsl)),
    secondary: hslToString(generateSecondaryColor(primaryHsl)),
    secondaryForeground: hslToString(getContrastColor(generateSecondaryColor(primaryHsl))),
    muted: `${primaryHsl.h} 15% 92%`,
    mutedForeground: '240 3.8% 46.1%',
    accent: hslToString(accentHsl),
    accentForeground: hslToString(getContrastColor(accentHsl)),
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: hslToString(accentHsl),
    sidebarAccent: hslToString(primaryHsl),
    sidebarAccentForeground: hslToString(getContrastColor(primaryHsl)),
  };

  const darkTheme = {
    background: '240 5% 12%',
    foreground: '0 0% 98%',
    card: '240 5% 15%',
    cardForeground: '0 0% 98%',
    popover: '240 5% 17%',
    popoverForeground: '0 0% 98%',
    primary: hslToString(primaryDark),
    primaryForeground: hslToString(getContrastColor(primaryDark)),
    secondary: hslToString(secondaryDark),
    secondaryForeground: hslToString(getContrastColor(secondaryDark)),
    muted: `${primaryHsl.h} 15% 20%`,
    mutedForeground: '240 5% 70%',
    accent: hslToString(accentDark),
    accentForeground: hslToString(getContrastColor(accentDark)),
    destructive: '0 62.8% 40%',
    destructiveForeground: '0 0% 98%',
    border: '240 4% 25%',
    input: '240 4% 25%',
    ring: hslToString(accentDark),
    sidebarAccent: hslToString(primaryDark),
    sidebarAccentForeground: hslToString(getContrastColor(primaryDark)),
  };

  const blackTheme = {
    background: '240 10% 4%',
    foreground: '0 0% 98%',
    card: '240 10% 5%',
    cardForeground: '0 0% 98%',
    popover: '240 10% 5%',
    popoverForeground: '0 0% 98%',
    primary: hslToString(primaryDark),
    primaryForeground: hslToString(getContrastColor(primaryDark)),
    secondary: hslToString(secondaryDark),
    secondaryForeground: hslToString(getContrastColor(secondaryDark)),
    muted: '240 5% 12%',
    mutedForeground: '240 5% 70%',
    accent: hslToString(accentDark),
    accentForeground: hslToString(getContrastColor(accentDark)),
    destructive: '0 62.8% 35%',
    destructiveForeground: '0 0% 98%',
    border: '240 3.7% 12%',
    input: '240 3.7% 12%',
    ring: hslToString(accentDark),
    sidebarAccent: hslToString(primaryDark),
    sidebarAccentForeground: hslToString(getContrastColor(primaryDark)),
  };

  return { light: lightTheme, dark: darkTheme, black: blackTheme };
}
