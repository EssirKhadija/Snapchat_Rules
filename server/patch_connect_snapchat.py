from pathlib import Path

path = Path('server/src/services/snapchat.service.ts')
text = path.read_text(encoding='utf-8')
start = 'export async function connectSnapchat(userId: string, tokens: { access_token: string; refresh_token: string; expires_in: number; account_id: string; account_name?: string; }) {'
end = 'export async function getSnapchatAccount(userId: string) {'
idx = text.find(start)
if idx == -1:
    raise SystemExit('start marker not found')
idx2 = text.find(end, idx)
if idx2 == -1:
    raise SystemExit('end marker not found')
old = text[idx:idx2]
new = '''export async function connectSnapchat(userId: string, tokens: any) {
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
'''
text = text[:idx] + new + text[idx2:]
path.write_text(text, encoding='utf-8')
print('patched')
