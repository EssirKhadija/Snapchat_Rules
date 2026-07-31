import axios from 'axios';
import FormData from 'form-data';
import { getSnapchatAccount, getValidAccessToken } from '../snapchat.service';
import { CampaignTemplate, BulkRow } from './bulk-launch.types';

const API_BASE = 'https://adsapi.snapchat.com/v1';

export async function bulkLaunchCampaign(
  userId: string,
  template: CampaignTemplate,
  row: any,
  fileBuffer?: Buffer
): Promise<{ campaignId: string; adSquadId: string; adId: string }> {

  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const accessToken = await getValidAccessToken(userId);
  const adAccountId = account.externalAccountId;

  const client = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });

  const fmt = (dateStr: string) => dateStr ? new Date(dateStr).toISOString() : undefined;

  // ── ÉTAPE 1 : Créer la Campaign ────────────────────────────
  console.log('🚀 Step 1: Creating campaign...');
  const campaignRes = await client.post(`/adaccounts/${adAccountId}/campaigns`, {
    campaigns: [{
      ad_account_id: adAccountId,
      name: row.campaignName,
      status: 'ACTIVE',
      objective_v2_type: template.objectiveV2Type,
      start_time: fmt(row.startDate),
      end_time: row.endDate ? fmt(row.endDate) : undefined,
      daily_budget_micro: row.budget ? Math.round(Number(row.budget) * 1_000_000) : undefined,
    }],
  });
  const campaignId = campaignRes.data?.campaigns?.[0]?.campaign?.id;
  if (!campaignId) throw new Error('Failed to create campaign');
  console.log('✅ Campaign created:', campaignId);

  // ── ÉTAPE 2 : Créer l'Ad Squad ─────────────────────────────
  console.log('🚀 Step 2: Creating ad squad...');
  const targeting: any = {
    geos: template.countries.map(c => ({ country_code: c })),
    demographics: [{
      min_age: template.ageMin,
      max_age: template.ageMax === 50 ? undefined : template.ageMax,
      ...(template.gender !== 'ALL' && { gender: template.gender }),
    }],
  };

  const adSquadPayload: any = {
    ad_account_id: adAccountId,
    campaign_id: campaignId,
    name: row.adSquadName || row.campaignName,
    status: 'ACTIVE',
    type: 'SNAP_ADS',
    optimization_goal: template.optimizationGoal,
    bid_strategy: template.bidStrategy,
    daily_budget_micro: Math.round(Number(row.budget) * 1_000_000),
    start_time: fmt(row.startDate),
    end_time: row.endDate ? fmt(row.endDate) : undefined,
    targeting,
    placement_v2: {
      config: template.placement === 'AUTOMATIC' ? 'AUTOMATIC' : 'CUSTOM',
    },
  };

  if (template.bidStrategy === 'LOWEST_COST_WITH_MAX_BID' && template.bidAmount) {
    adSquadPayload.bid_micro = Math.round(template.bidAmount * 1_000_000);
  }

  if (template.pixelId && template.optimizationGoal.startsWith('PIXEL')) {
    adSquadPayload.pixel_id = template.pixelId;
  }

  const adSquadRes = await client.post(`/adaccounts/${adAccountId}/adsquads`, {
    adsquads: [adSquadPayload],
  });
  const adSquadId = adSquadRes.data?.adsquads?.[0]?.adsquad?.id;
  if (!adSquadId) throw new Error('Failed to create ad squad');
  console.log('✅ Ad Squad created:', adSquadId);

  // ── ÉTAPE 3 : Upload le média ──────────────────────────────
  console.log('🚀 Step 3: Uploading media...');
  const isVideo = fileBuffer
    ? true
    : row.creativeUrl?.match(/\.(mp4|mov|avi|webm)$/i);

  const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

  // 3a. Créer l'objet média
  const mediaObjRes = await client.post(`/adaccounts/${adAccountId}/media`, {
    media: [{
      name: `${row.adName || row.campaignName} — Creative`,
      type: mediaType,
      ad_account_id: adAccountId,
    }],
  });
  const mediaId = mediaObjRes.data?.media?.[0]?.media?.id;
  if (!mediaId) throw new Error('Failed to create media object');

  // 3b. Upload le fichier (buffer ou URL)
  const formData = new FormData();
  if (fileBuffer) {
    // Option B : fichier uploadé par le client
    formData.append('file', fileBuffer, {
      filename: `creative.${isVideo ? 'mp4' : 'jpg'}`,
      contentType: isVideo ? 'video/mp4' : 'image/jpeg',
    });
  } else if (row.creativeUrl) {
    // Option A : télécharger depuis URL
    const urlRes = await axios.get(row.creativeUrl, { responseType: 'arraybuffer' });
    const ext = row.creativeUrl.split('.').pop()?.toLowerCase() ?? 'mp4';
    formData.append('file', Buffer.from(urlRes.data), {
      filename: `creative.${ext}`,
      contentType: urlRes.headers['content-type'] ?? 'video/mp4',
    });
  } else {
    throw new Error('No creative provided (no file and no URL)');
  }

  await client.post(`/media/${mediaId}/upload`, formData, {
    headers: { ...formData.getHeaders(), Authorization: `Bearer ${accessToken}` },
  });
  console.log('✅ Media uploaded:', mediaId);

  // ── ÉTAPE 4 : Créer le Creative ───────────────────────────
  console.log('🚀 Step 4: Creating creative...');
  const creativeRes = await client.post(`/adaccounts/${adAccountId}/creatives`, {
    creatives: [{
      ad_account_id: adAccountId,
      name: `${row.adName || row.campaignName} — Creative`,
      type: 'SNAP_AD',
      top_snap_media_id: mediaId,
      headline: row.headline,
      call_to_action: template.callToAction,
      shareable: true,
    }],
  });
  const creativeId = creativeRes.data?.creatives?.[0]?.creative?.id;
  if (!creativeId) throw new Error('Failed to create creative');
  console.log('✅ Creative created:', creativeId);

  // ── ÉTAPE 5 : Créer l'Ad ──────────────────────────────────
  console.log('🚀 Step 5: Creating ad...');
  const adRes = await client.post(`/adaccounts/${adAccountId}/ads`, {
    ads: [{
      ad_account_id: adAccountId,
      ad_squad_id: adSquadId,
      creative_id: creativeId,
      name: row.adName || row.campaignName,
      status: 'ACTIVE',
      type: 'SNAP_AD',
    }],
  });
  const adId = adRes.data?.ads?.[0]?.ad?.id;
  if (!adId) throw new Error('Failed to create ad');
  console.log('✅ Ad created:', adId);

  return { campaignId, adSquadId, adId };
}