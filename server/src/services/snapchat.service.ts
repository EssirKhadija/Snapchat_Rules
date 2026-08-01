import axios from 'axios';
import crypto from 'crypto';
import prisma from '../prisma/client';

const SNAP_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token';
const SNAP_API_BASE = 'https://adsapi.snapchat.com/v1';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

// ── Encryption ─────────────────────────────────────────────────
function getKey(): Buffer {
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

// ── Pending tokens (temporaire en mémoire — 10 min) ───────────
const pendingTokens = new Map<string, {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}>();

// ── Authorization URL ──────────────────────────────────────────
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

// ── Exchange code + récupérer tous les Ad Accounts ────────────
export async function exchangeAndGetAdAccounts(userId: string, code: string): Promise<{
  adAccounts: Array<{
    id: string;
    name: string;
    organizationId: string;
    currency: string;
    timezone: string;
  }>;
}> {
  // Étape 1 : Échanger le code contre les tokens
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
  if (!access_token) throw new Error('Token exchange failed: no access_token');

  // Stocker les tokens temporairement
  pendingTokens.set(userId, {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in ?? 3600,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // Étape 2 : Récupérer toutes les organisations + Ad Accounts
  const orgsRes = await axios.get(
    `${SNAP_API_BASE}/me/organizations?with_ad_accounts=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const organizations: any[] = orgsRes.data?.organizations ?? [];
  const adAccounts: Array<{
    id: string;
    name: string;
    organizationId: string;
    currency: string;
    timezone: string;
  }> = [];

  for (const orgWrapper of organizations) {
    const org = orgWrapper.organization;
    const orgId = org.id;
    let accounts: any[] = org.ad_accounts ?? [];

    // Fallback si pas inclus dans la réponse
    if (accounts.length === 0) {
      try {
        const res = await axios.get(
          `${SNAP_API_BASE}/organizations/${orgId}/adaccounts`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        accounts = res.data?.adaccounts ?? [];
      } catch { /* ignore */ }
    }

    for (const wrapper of accounts) {
      const acc = wrapper.ad_account ?? wrapper;
      if (acc.id) {
        adAccounts.push({
          id: acc.id,
          name: acc.name ?? 'Ad Account',
          organizationId: orgId,
          currency: acc.currency ?? 'USD',
          timezone: acc.timezone ?? 'UTC',
        });
      }
    }
  }

  console.log(`✅ Found ${adAccounts.length} Ad Account(s) for user ${userId}`);
  return { adAccounts };
}

// ── Sauvegarder l'Ad Account sélectionné ─────────────────────
export async function selectAdAccount(
  userId: string,
  adAccountId: string,
  organizationId: string,
  displayName: string
): Promise<void> {
  const pending = pendingTokens.get(userId);
  if (!pending) throw new Error('Session expired. Please reconnect your Snapchat account.');
  if (Date.now() > pending.expiresAt) {
    pendingTokens.delete(userId);
    throw new Error('Session expired. Please reconnect your Snapchat account.');
  }

  const tokenExpiresAt = new Date(Date.now() + pending.expiresIn * 1000);

  await prisma.snapchatAccount.upsert({
    where: { userId },
    create: {
      userId,
      externalAccountId: adAccountId,
      organizationId,
      displayName,
      accessToken: encrypt(pending.accessToken),
      refreshToken: encrypt(pending.refreshToken),
      tokenExpiresAt,
    },
    update: {
      externalAccountId: adAccountId,
      organizationId,
      displayName,
      accessToken: encrypt(pending.accessToken),
      refreshToken: encrypt(pending.refreshToken),
      tokenExpiresAt,
    },
  });

  pendingTokens.delete(userId);
  console.log(`✅ Ad Account selected: ${displayName} (${adAccountId})`);
}

// ── Ancien connectSnapchat — garde pour compatibilité ─────────
// (utilisé si un seul Ad Account trouvé)
export async function connectSnapchat(userId: string, code: string): Promise<void> {
  const { adAccounts } = await exchangeAndGetAdAccounts(userId, code);
  if (adAccounts.length === 0) throw new Error('No Ad Account found');
  const first = adAccounts[0];
  await selectAdAccount(userId, first.id, first.organizationId, first.name);
}

// ── Helpers ───────────────────────────────────────────────────
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

export async function refreshSnapchatToken(userId: string) {
  const token = await getValidAccessToken(userId);
  return { access_token: token };
}