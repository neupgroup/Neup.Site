
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma as db } from '#/core/database/prisma';
import crypto from 'crypto';

const getAccountId = async () => {
  const cookieStore = await cookies();
  let accountId = cookieStore.get('account_id')?.value;
  if (!accountId) {
    accountId = `user_${crypto.randomBytes(8).toString('hex')}`;
    cookieStore.set('account_id', accountId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  }
  return accountId;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('github_oauth_state')?.value;

  try {
    if (!state || !storedState || state !== storedState) throw new Error('Invalid state parameter. CSRF attack detected?');
    cookieStore.delete('github_oauth_state');
    if (!code) throw new Error('Authorization code not found in request from GitHub.');

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) throw new Error('GitHub OAuth app is not configured on the server.');

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description || 'Failed to fetch access token from GitHub.');

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/vnd.github+json' },
    });
    if (!userResponse.ok) throw new Error('Failed to fetch GitHub user profile.');
    const githubUser = await userResponse.json();

    const accountId = await getAccountId();
    const providerUserId = githubUser.id.toString();

    const existing = await db.linkedAccount.findFirst({
      where: { account_id: accountId, platform: 'github', providerUserId },
    });

    if (!existing) {
      await db.linkedAccount.create({
        data: {
          account_id: accountId,
          platform: 'github',
          authorized_on: new Date(),
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          scope: tokenData.scope,
          providerUserId,
          providerUsername: githubUser.login,
        },
      });
    }

    const redirectUrl = new URL('/settings/accounts', req.nextUrl.origin);
    redirectUrl.searchParams.set('success', 'true');
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('GitHub callback error:', error);
    const redirectUrl = new URL('/settings/accounts/github', req.nextUrl.origin);
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message || 'An unknown error occurred during GitHub authentication.'));
    return NextResponse.redirect(redirectUrl);
  }
}
