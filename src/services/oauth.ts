import { OAuth2Client } from 'google-auth-library';
import { CONFIG } from '../config';
import { v4 as uuidv4 } from 'uuid';

const client = new OAuth2Client(
  CONFIG.google.clientId,
  CONFIG.google.clientSecret,
  CONFIG.google.redirectUri
);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export function generateAuthUrl(state: string): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state
  });
}

export async function getTokensFromCode(code: string): Promise<{ access_token: string; id_token?: string }> {
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    id_token: tokens.id_token || undefined
  };
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  client.setCredentials({ access_token: accessToken });

  const ticket = await client.getTokenInfo(accessToken);

  // Fetch user info from Google
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info from Google');
  }

  const data = await response.json() as any;

  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture
  };
}

export function generateState(): string {
  return uuidv4();
}
