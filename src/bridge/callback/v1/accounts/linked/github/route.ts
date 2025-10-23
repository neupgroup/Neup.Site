
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = cookies();
  const storedState = cookieStore.get('github_oauth_state')?.value;

  try {
    if (!state || !storedState || state !== storedState) {
        throw new Error('Invalid state parameter. CSRF attack detected?');
    }

    cookieStore.delete('github_oauth_state');

    if (!code) {
        throw new Error('Authorization code not found in request from GitHub.');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('GitHub OAuth app is not configured on the server.');
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
        throw new Error(tokenData.error_description || 'Failed to fetch access token from GitHub.');
    }

    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/vnd.github+json',
        },
    });
    
    if (!userResponse.ok) {
        throw new Error('Failed to fetch GitHub user profile.');
    }
    
    const githubUser = await userResponse.json();
    
    const accountId = 'user_placeholder_123';
    cookieStore.set('account_id', accountId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // One year
        path: '/',
    });


    const { firestore } = initializeFirebase();
    
    // Before adding, check if an account for this GitHub user ID already exists for this accountId
    const existingQuery = query(
        collection(firestore, 'linked_accounts'),
        where('account_id', '==', accountId),
        where('platform', '==', 'github'),
        where('authorization_info.provider_user_id', '==', githubUser.id.toString())
    );
    const existingDocs = await getDocs(existingQuery);
    
    if (existingDocs.empty) {
        await addDoc(collection(firestore, `linked_accounts`), {
          account_id: accountId,
          platform: 'github',
          authorized_on: serverTimestamp(),
          authorization_info: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            scope: tokenData.scope,
            provider_user_id: githubUser.id.toString(),
            provider_username: githubUser.login,
          }
        });
    }

    const redirectUrl = new URL('/settings/accounts', req.nextUrl.origin);
    redirectUrl.searchParams.set('success', 'true');
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error("GitHub callback error:", error);
    const errorMessage = encodeURIComponent(error.message || 'An unknown error occurred during GitHub authentication.');
    const redirectUrl = new URL('/settings/accounts/github', req.nextUrl.origin);
    redirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }
}
