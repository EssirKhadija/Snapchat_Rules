import axios from 'axios';
import qs from 'qs';
import prisma from '../prisma/client';
import { encrypt, decrypt } from '../utils/crypto';
import {
  SNAPCHAT_CLIENT_ID,
  SNAPCHAT_CLIENT_SECRET,
  SNAPCHAT_REDIRECT_URI
} from '../config';

const AUTH_URL = 'https://accounts.snapchat.com/login/oauth2/authorize';
const TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token';

export function getAuthorizationUrl(state: string) {
  const query = qs.stringify({
    client_id: SNAPCHAT_CLIENT_ID,
    redirect_uri: SNAPCHAT_REDIRECT_URI,
    response_type: 'code',
    scope: 'snapchat-marketing-api',
    state
  });
  return `${AUTH_URL}?${query}`;
}

export async function exchangeCodeForTokens(code: string) {
  const payload = qs.stringify({
    client_id: SNAPCHAT_CLIENT_ID,
    client_secret: SNAPCHAT_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: SNAPCHAT_REDIRECT_URI
  });

  try {
    const response = await axios.post(TOKEN_URL, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;

  } catch (error: any) {
    console.log("========== SNAPCHAT ERROR ==========");
    console.log(error.response?.status);
    console.log(error.response?.data);
    throw error;
  }
}

export async function refreshSnapchatToken(accountId: string) {
  const account = await prisma.snapchatAccount.findFirst({ where: { externalAccountId: accountId } });
  if (!account) return null;

  const refreshToken = decrypt(account.refreshTokenEncrypted);

  const payload = qs.stringify({
    client_id: SNAPCHAT_CLIENT_ID,
    client_secret: SNAPCHAT_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await axios.post(TOKEN_URL, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = response.data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  await prisma.snapchatAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEncrypted: encrypt(data.access_token),
      refreshTokenEncrypted: encrypt(data.refresh_token),
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      updatedAt: new Date()
    }
  });

  return data;
}

export async function disconnectSnapchat(userId: string) {
  await prisma.snapchatAccount.deleteMany({ where: { userId } });
}

export async function connectSnapchat(userId: string, tokens: { access_token: string; refresh_token: string; expires_in: number; account_id: string; account_name?: string; }) {
  if (!tokens) throw new Error('Missing tokens in Snapchat token response');

  // Helper: try to extract account id from token response or by calling Snapchat Marketing APIs
  async function resolveAccountId(toks: { access_token: string; refresh_token?: string; expires_in?: number; account_id?: string; account_name?: string; }) {
    // 1) direct fields
    if (toks.account_id) return toks.account_id;
    // common alternative names
    // @ts-ignore
    if ((toks as any).advertiser_id) return (toks as any).advertiser_id;

    const client = axios.create({ baseURL: 'https://adsapi.snapchat.com', headers: { Authorization: `Bearer ${toks.access_token}` }, timeout: 5000 });

    // Try endpoints in order and attempt to parse common shapes
    const endpoints = ['/v1/me', '/v1/advertisers', '/v1/ad_accounts', '/v1/adaccounts', '/v1/advertiser'];
    for (const ep of endpoints) {
      try {
        const resp = await client.get(ep);
        const body = resp.data || {};

        // try multiple possible shapes
        if (body.advertisers && Array.isArray(body.advertisers) && body.advertisers.length > 0) {
          const a = body.advertisers[0];
          return (a.id || a.advertiser_id || a.account_id || a.ad_account_id)?.toString();
        }

        if (body.data && Array.isArray(body.data) && body.data.length > 0) {
          const a = body.data[0];
          return (a.id || a.advertiser_id || a.account_id)?.toString();
        }

        if (body.account_id) return body.account_id.toString();
        if (body.advertiser_id) return body.advertiser_id.toString();
        if (body.id) return body.id.toString();
      } catch (err: any) {
        // continue to next endpoint, but log minimal info for debugging
        console.warn(`Snapchat: ${ep} failed:`, err?.response?.status || err.message);
      }
    }

    return undefined;
  }

  const resolved = await resolveAccountId(tokens);
  if (!resolved) {
    console.error('Snapchat: unable to determine account_id from token response or API; token response keys:', Object.keys(tokens));
    throw new Error('Missing account_id in Snapchat token response');
  }

  tokens.account_id = resolved;

  const encryptedAccess = encrypt(tokens.access_token);
  const encryptedRefresh = encrypt(tokens.refresh_token);

  return prisma.snapchatAccount.upsert({
    where: { userId },
    update: {
      externalAccountId: tokens.account_id,
      displayName: tokens.account_name || tokens.account_id,
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      status: 'CONNECTED'
    },
    create: {
      userId,
      externalAccountId: tokens.account_id,
      displayName: tokens.account_name || tokens.account_id,
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      status: 'CONNECTED'
    }
  });
}

export async function getSnapchatAccount(userId: string) {
  return prisma.snapchatAccount.findUnique({ where: { userId } });
}
