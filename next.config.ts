import type { NextConfig } from 'next';

function getConfiguredBasePath(): string | undefined {
  const value = process.env.NEXT_PUBLIC_APP_BASEPATH ?? process.env.APP_BASEPATH;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalizedValue = (() => {
    try {
      if (/^https?:\/\//i.test(trimmed)) {
        return new URL(trimmed).pathname;
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  })();

  const withoutTrailingSlash = normalizedValue.replace(/\/+$/, '');
  if (!withoutTrailingSlash || withoutTrailingSlash === '/') return undefined;

  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['dev.neupgroup.com'],
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: getConfiguredBasePath(),
  turbopack: {
    root: process.cwd(),
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  serverExternalPackages: ['ssh2', 'node-ssh', '@prisma/client', '.prisma/client'],
  images: {
    localPatterns: [
      {
        pathname: '/bridge/api.v1/asset/logo',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'neupgroup.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
  },
};

export default nextConfig;
