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

    // Debug: log token response structure so we can extract account_id from the response.
    try {
      console.log('Snapchat token response keys:', Object.keys(response.data || {}));
      if (response.data?.id_token) {
        try {
          const parts = response.data.id_token.split('.');
          if (parts.length === 3) {
            const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
            const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
            console.log('Snapchat id_token payload keys:', Object.keys(decoded || {}));
          }
        } catch (err: any) {
          console.warn('Failed to decode id_token payload', err?.message);
        }
      }
      if (response.data?.token_responses) {
        const trs = Array.isArray(response.data.token_responses) ? response.data.token_responses : [response.data.token_responses];
        trs.forEach((tr: any, idx: number) => {
          console.log(`token_responses[${idx}] keys:`, Object.keys(tr || {}));
          if (tr?.id_token && typeof tr.id_token === 'string') {
            try {
              const parts = tr.id_token.split('.');
              if (parts.length === 3) {
                const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
                const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
                console.log(`token_responses[${idx}] id_token payload keys:`, Object.keys(decoded || {}));
              }
            } catch (err: any) {
              console.warn('Failed to decode token_responses id_token', err?.message);
            }
          }
        });
      }
    } catch (err: any) {
      console.warn('Error logging token response shape', err?.message);
    }

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

export async function connectSnapchat(userId: string, tokens: any) {
  if (!tokens) throw new Error('Missing tokens in Snapchat token response');

  function decodeJwtPayload(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return undefined;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    } catch {
      return undefined;
    }
  }

  function extractAccountId(item: any): string | undefined {
    if (!item || typeof item !== 'object') return undefined;
    if (item.account_id) return item.account_id?.toString();
    if (item.advertiser_id) return item.advertiser_id?.toString();
    if (item.ad_account_id) return item.ad_account_id?.toString();
    if (item.id) return item.id?.toString();
    if (Array.isArray(item.advertisers) && item.advertisers.length > 0) return extractAccountId(item.advertisers[0]);
    if (Array.isArray(item.data) && item.data.length > 0) return extractAccountId(item.data[0]);
    if (item.data && typeof item.data === 'object') return extractAccountId(item.data);
    if (item.profile && typeof item.profile === 'object') return extractAccountId(item.profile);
    return undefined;
  }

  async function resolveAccountId(toks: any) {
    if (toks.account_id) return toks.account_id?.toString();
    if (toks.advertiser_id) return toks.advertiser_id?.toString();
    if (toks.ad_account_id) return toks.ad_account_id?.toString();

    if (toks.id_token && typeof toks.id_token === 'string') {
      const payload = decodeJwtPayload(toks.id_token);
      const extracted = extractAccountId(payload);
      if (extracted) return extracted;
      if (payload?.sub) return payload.sub.toString();
    }

    if (toks.token_responses) {
      const responses = Array.isArray(toks.token_responses) ? toks.token_responses : [toks.token_responses];
      for (const response of responses) {
        if (!response || typeof response !== 'object') continue;
        const extracted = extractAccountId(response);
        if (extracted) return extracted;
        if (response.id_token && typeof response.id_token === 'string') {
          const payload = decodeJwtPayload(response.id_token);
          const nested = extractAccountId(payload);
          if (nested) return nested;
          if (payload?.sub) return payload.sub.toString();
        }
      }
    }

    const client = axios.create({ baseURL: 'https://adsapi.snapchat.com', headers: { Authorization: `Bearer ${toks.access_token}` }, timeout: 5000 });
    const endpoints = ['/v1/me', '/v1/advertisers', '/v1/ad_accounts', '/v1/adaccounts', '/v1/advertiser'];
    for (const ep of endpoints) {
      try {
        const resp = await client.get(ep);
        const extracted = extractAccountId(resp.data);
        if (extracted) return extracted;
      } catch (err: any) {
        console.warn(`Snapchat: ${ep} failed:`, err?.response?.status || err.message);
      }
    }

    return undefined;
  }

  const resolved = await resolveAccountId(tokens);
  if (!resolved) {
    console.error('Snapchat: unable to determine account_id from token response or API; token response keys:', Object.keys(tokens));
    if (tokens.token_responses) {
      const tokenResponseKeys = Array.isArray(tokens.token_responses)
        ? tokens.token_responses.map((tr: any) => (tr && typeof tr === 'object' ? Object.keys(tr) : []))
        : Object.keys(tokens.token_responses || {});
      console.error('Snapchat: token_responses keys:', tokenResponseKeys);
    }
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
