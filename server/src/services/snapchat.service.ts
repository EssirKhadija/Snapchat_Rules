import axios from 'axios';
import crypto from 'crypto';
import prisma from '../prisma/client';

const SNAP_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token';
const SNAP_API_BASE = 'https://adsapi.snapchat.com/v1';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function getKey(): Buffer {
  // Hash la clé pour toujours obtenir exactement 32 bytes, quelle que soit sa longueur
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

// Accepte maintenant un state (userId) pour le passer à Snapchat
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SNAPCHAT_CLIENT_ID!,
    redirect_uri: process.env.SNAPCHAT_REDIRECT_URI!,
    response_type: 'code',
    scope: 'snapchat-marketing-api',
    state,
  });
  return `https://accounts.snapchat.com/login/oauth2/authorize?${params.toString()}`;
}

export async function connectSnapchat(userId: string, code: string): Promise<void> {
  const tokenRes = await axios.post(
    SNAP_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SNAPCHAT_CLIENT_ID!,
      client_secret: process.env.SNAPCHAT_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SNAPCHAT_REDIRECT_URI!,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;
  if (!access_token) throw new Error('Snapchat token exchange failed: no access_token');

  console.log('✅ Token exchange OK. Fetching organizations...');

  const orgsRes = await axios.get(
    `${SNAP_API_BASE}/me/organizations?with_ad_accounts=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const organizations: any[] = orgsRes.data?.organizations ?? [];
  if (organizations.length === 0) {
    throw new Error('No Snapchat organization found. Make sure the user is an Organization Admin.');
  }

  const firstOrg = organizations[0]?.organization;
  if (!firstOrg) throw new Error('Could not parse organization from Snapchat response');

  const organizationId: string = firstOrg.id;
  const organizationName: string = firstOrg.name ?? 'Snapchat Org';
  const adAccounts: any[] = firstOrg.ad_accounts ?? [];

  let adAccountId: string;
  let adAccountName: string;

  if (adAccounts.length > 0) {
    const activeAccount = adAccounts.find((a: any) => a.ad_account?.status === 'ACTIVE');
    const chosenAccount = activeAccount ?? adAccounts[0];
    adAccountId = chosenAccount.ad_account?.id ?? chosenAccount.id;
    adAccountName = chosenAccount.ad_account?.name ?? chosenAccount.name ?? 'Ad Account';
  } else {
    console.log('⚠️ No ad_accounts in org response, fetching separately...');
    const adAccountsRes = await axios.get(
      `${SNAP_API_BASE}/organizations/${organizationId}/adaccounts`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const fetchedAccounts: any[] = adAccountsRes.data?.adaccounts ?? [];
    if (fetchedAccounts.length === 0) {
      throw new Error(`No Ad Account found under organization ${organizationId}.`);
    }
    const active = fetchedAccounts.find((a: any) => a.adaccount?.status === 'ACTIVE');
    const chosen = active ?? fetchedAccounts[0];
    adAccountId = chosen.adaccount?.id ?? chosen.id;
    adAccountName = chosen.adaccount?.name ?? chosen.name ?? 'Ad Account';
  }

  console.log(`✅ Organization: ${organizationName} (${organizationId})`);
  console.log(`✅ Ad Account: ${adAccountName} (${adAccountId})`);

  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

  await prisma.snapchatAccount.upsert({
    where: { userId },
    create: {
      userId,
      externalAccountId: adAccountId,
      organizationId,
      displayName: adAccountName,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt,
    },
    update: {
      externalAccountId: adAccountId,
      organizationId,
      displayName: adAccountName,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt,
    },
  });

  console.log('✅ Snapchat account saved to Prisma');
}

// Alias utilisé par le controller et snapchat-ads.service
export async function getSnapchatAccount(userId: string) {
  return prisma.snapchatAccount.findUnique({ where: { userId } });
}

export async function getSnapchatMe(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) return null;
  return {
    displayName: account.displayName,
    externalAccountId: account.externalAccountId,
    organizationId: account.organizationId,
  };
}

export async function disconnectSnapchat(userId: string): Promise<void> {
  await prisma.snapchatAccount.deleteMany({ where: { userId } });
  console.log(`✅ Snapchat account disconnected for user ${userId}`);
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const fiveMinutes = 5 * 60 * 1000;
  if (account.tokenExpiresAt > new Date(Date.now() + fiveMinutes)) {
    return decrypt(account.accessToken);
  }

  console.log('🔄 Refreshing Snapchat access token...');
  const res = await axios.post(
    SNAP_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SNAPCHAT_CLIENT_ID!,
      client_secret: process.env.SNAPCHAT_CLIENT_SECRET!,
      refresh_token: decrypt(account.refreshToken),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = res.data;
  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

  await prisma.snapchatAccount.update({
    where: { userId },
    data: {
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt,
    },
  });

  console.log('✅ Token refreshed');
  return access_token;
}

// Gardé pour compatibilité avec d'éventuels anciens imports
export async function refreshSnapchatToken(userId: string) {
  const token = await getValidAccessToken(userId);
  return { access_token: token };
}