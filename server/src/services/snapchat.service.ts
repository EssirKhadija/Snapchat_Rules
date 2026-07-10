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

  // If Snapchat token response does not include account_id, try fetching it from the API using the access token
  if (!tokens.account_id) {
    try {
      const meResp = await axios.get('https://adsapi.snapchat.com/v1/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      // Try a few common response shapes to extract an advertiser/account id
      const data = meResp.data || {};
      const advertisers = data.advertisers || data.data?.advertisers || data.data?.advertiser || null;
      if (Array.isArray(advertisers) && advertisers.length > 0) {
        tokens.account_id = (advertisers[0].id || advertisers[0].advertiser_id || advertisers[0].account_id)?.toString();
      } else if (data.account_id || data.data?.account_id) {
        tokens.account_id = (data.account_id || data.data.account_id).toString();
      }
    } catch (err: any) {
      // ignore; we'll throw below if still missing
      console.warn('Unable to fetch Snapchat /me to determine account_id', err?.response?.data || err.message);
    }
  }

  if (!tokens.account_id) {
    throw new Error('Missing account_id in Snapchat token response');
  }

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
