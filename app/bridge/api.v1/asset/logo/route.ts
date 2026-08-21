/*
::neup.documentation::bridge-api-v1-asset-logo
::api GET /bridge/api.v1/asset/logo

Transforms shared Neup SVG logos into theme-aware variants.

::public

Accepts a source `url` plus resolved color values and returns a recolored SVG.

Only the shared three-tone Neup logo palette is rewritten:
- `#292D32` becomes the theme primary color
- `#2F2F2F` becomes a tinted primary
- white fills and strokes become the header background color

Non-SVG responses are proxied unchanged.

::public end
::end
*/

import type { NextRequest } from 'next/server';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const SOURCE_DARK_HEX = '#292D32';
const SOURCE_TINT_HEX = '#2F2F2F';

function isSafeHexColor(value: string | null): value is string {
  return !!value && HEX_COLOR_PATTERN.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveSourceUrl(rawUrl: string, request: NextRequest): URL | null {
  try {
    if (rawUrl.startsWith('/')) {
      return new URL(rawUrl, request.nextUrl.origin);
    }

    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function replaceSvgPalette(svg: string, colors: { primary: string; background: string; tint: string }): string {
  let nextSvg = svg;

  const replacements = [
    {
      pattern: new RegExp(`(fill\\s*=\\s*["'])${escapeRegExp(SOURCE_DARK_HEX)}(["'])`, 'gi'),
      value: `$1${colors.primary}$2`,
    },
    {
      pattern: new RegExp(`(fill\\s*=\\s*["'])${escapeRegExp(SOURCE_TINT_HEX)}(["'])`, 'gi'),
      value: `$1${colors.tint}$2`,
    },
    {
      pattern: /(fill\s*=\s*["'])(white|#fff(?:fff)?)(["'])/gi,
      value: `$1${colors.background}$3`,
    },
    {
      pattern: /(stroke\s*=\s*["'])(white|#fff(?:fff)?)(["'])/gi,
      value: `$1${colors.background}$3`,
    },
  ];

  for (const replacement of replacements) {
    nextSvg = nextSvg.replace(replacement.pattern, replacement.value);
  }

  return nextSvg;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('url');
  const primary = request.nextUrl.searchParams.get('primary');
  const background = request.nextUrl.searchParams.get('background');
  const tint = request.nextUrl.searchParams.get('tint');

  if (!source) {
    return new Response('Missing logo URL.', { status: 400 });
  }

  if (!isSafeHexColor(primary) || !isSafeHexColor(background) || !isSafeHexColor(tint)) {
    return new Response('Invalid logo theme colors.', { status: 400 });
  }

  const sourceUrl = resolveSourceUrl(source, request);
  if (!sourceUrl) {
    return new Response('Invalid logo URL.', { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(sourceUrl, {
      headers: {
        accept: 'image/svg+xml,image/*;q=0.9,*/*;q=0.8',
      },
      cache: 'force-cache',
    });

    if (!upstreamResponse.ok) {
      return new Response('Failed to fetch logo.', { status: upstreamResponse.status });
    }

    const contentType = upstreamResponse.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('image/svg+xml')) {
      const body = await upstreamResponse.arrayBuffer();
      return new Response(body, {
        status: upstreamResponse.status,
        headers: {
          'content-type': contentType || 'application/octet-stream',
          'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    const svg = await upstreamResponse.text();
    const transformedSvg = replaceSvgPalette(svg, { primary, background, tint });

    return new Response(transformedSvg, {
      status: 200,
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Failed to transform logo.', { status: 502 });
  }
}
