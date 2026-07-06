import { syncCampaigns, syncAdSquads, syncAds } from './snapchat-ads.service';
import { runRuleEngine } from '../rules/engine';
import logger from '../../utils/logger';

export async function syncAllData(userId: string) {
  try {
    logger.info('Starting Snapchat sync workflow', { userId });
    const campaigns = await syncCampaigns(userId);
    const adSquads = await syncAdSquads(userId);
    const ads = await syncAds(userId);
    logger.info('Snapchat sync completed', { userId, campaigns: campaigns.length, adSquads: adSquads.length, ads: ads.length });

    logger.info('Starting rule evaluation after sync', { userId, campaigns: campaigns.length });
    const rulesResult = await runRuleEngine(userId, false);
    logger.info('Rule evaluation completed', {
      userId,
      rulesEvaluated: rulesResult.rulesEvaluated,
      campaignsEvaluated: rulesResult.campaignsEvaluated,
      summaries: rulesResult.summaries.length,
    });

    return {
      campaigns: campaigns.length,
      adSquads: adSquads.length,
      ads: ads.length,
      rules: {
        rulesEvaluated: rulesResult.rulesEvaluated,
        campaignsEvaluated: rulesResult.campaignsEvaluated,
        summaries: rulesResult.summaries,
      },
    };
  } catch (error) {
    logger.error('Snapchat sync workflow failed', { userId, error });
    throw error;
  }
}
