

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
  // Using a simple lightness threshold to determine contrast
  return hsl.l > 60 ? { h: 0, s: 0, l: 0 } : { h: 0, s: 0, l: 100 };
}

function hslToString(hsl: HSL): string {
    return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
}

export function generateThemeFromColor(hexColors: string[]) {
    if (!hexColors || hexColors.length === 0) {
        // Return a default theme if no colors are provided
        hexColors = ['#64C5CF', '#2A9D8F'];
    }

    const primaryHex = hexColors[0];
    const accentHex = hexColors[1] || primaryHex; // Fallback for accent

    const primaryRgb = hexToRgb(primaryHex);
    const accentRgb = hexToRgb(accentHex);
    
    if (!primaryRgb || !accentRgb) {
        throw new Error('Invalid HEX color format');
    }

    const primaryHsl = rgbToHsl(primaryRgb);
    const accentHsl = rgbToHsl(accentRgb);

    const lightTheme = {
        background: '210 20% 98%',
        foreground: '240 10% 3.9%',
        card: '0 0% 100%',
        cardForeground: '240 10% 3.9%',
        popover: '0 0% 100%',
        popoverForeground: '240 10% 3.9%',
        primary: hslToString(primaryHsl),
        primaryForeground: hslToString(getContrastColor(primaryHsl)),
        secondary: `${primaryHsl.h} ${Math.max(0, primaryHsl.s - 20)}% ${Math.min(100, primaryHsl.l + 35)}%`,
        secondaryForeground: hslToString(getContrastColor({ h: primaryHsl.h, s: Math.max(0, primaryHsl.s - 20), l: Math.min(100, primaryHsl.l + 35) })),
        muted: `${primaryHsl.h} 30% 95%`,
        mutedForeground: '240 3.8% 46.1%',
        accent: hslToString(accentHsl),
        accentForeground: hslToString(getContrastColor(accentHsl)),
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '240 5.9% 90%',
        input: '240 5.9% 90%',
        ring: hslToString(accentHsl),
        sidebarAccent: hslToString({h: primaryHsl.h, s: primaryHsl.s, l: Math.min(100, primaryHsl.l + 10)}),
        sidebarAccentForeground: hslToString(getContrastColor({h: primaryHsl.h, s: primaryHsl.s, l: Math.min(100, primaryHsl.l + 10)})),
    };

    const darkTheme = {
        background: '240 10% 3.9%',
        foreground: '0 0% 98%',
        card: '240 10% 3.9%',
        cardForeground: '0 0% 98%',
        popover: '240 10% 3.9%',
        popoverForeground: '0 0% 98%',
        primary: hslToString(primaryHsl),
        primaryForeground: hslToString(getContrastColor(primaryHsl)),
        secondary: `${primaryHsl.h} ${Math.max(0, primaryHsl.s - 30)}% ${Math.max(0, primaryHsl.l - 40)}%`,
        secondaryForeground: hslToString(getContrastColor({ h: primaryHsl.h, s: Math.max(0, primaryHsl.s - 30), l: Math.max(0, primaryHsl.l - 40) })),
        muted: `${primaryHsl.h} 10% 15%`,
        mutedForeground: '240 5% 64.9%',
        accent: hslToString(accentHsl),
        accentForeground: hslToString(getContrastColor(accentHsl)),
        destructive: '0 62.8% 30.6%',
        destructiveForeground: '0 0% 98%',
        border: '240 3.7% 15.9%',
        input: '240 3.7% 15.9%',
        ring: hslToString(accentHsl),
        sidebarAccent: hslToString({h: primaryHsl.h, s: primaryHsl.s, l: Math.max(0, primaryHsl.l - 50)}),
        sidebarAccentForeground: hslToString(getContrastColor({h: primaryHsl.h, s: primaryHsl.s, l: Math.max(0, primaryHsl.l - 50)})),
    };

    return { light: lightTheme, dark: darkTheme };
}
