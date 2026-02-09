#!/usr/bin/env node

import { config } from 'dotenv';
config({ path: '/root/.openclaw/.env' });
import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// Configuration
const CONFIG = {
  API_BASE: 'https://ads-api.twitter.com/12',
  API_VERSION: '12',
};

class TwitterAdsCLI {
  private oauth: OAuth;
  private credentials: {
    key: string;
    secret: string;
  };
  private token: {
    key: string;
    secret: string;
  };
  private accountId: string;

  constructor() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;
    const accountId = process.env.TWITTER_ADS_ACCOUNT_ID;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret || !accountId) {
      throw new Error('Missing required Twitter Ads API credentials in environment variables');
    }

    this.oauth = OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
    });

    this.credentials = { key: apiKey, secret: apiSecret };
    this.token = { key: accessToken, secret: accessSecret };
    this.accountId = accountId;
  }

  private async makeAPIRequest(method: string, endpoint: string, params?: any): Promise<any> {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    
    const request = {
      url,
      method,
      data: method === 'POST' || method === 'PUT' ? params : undefined,
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(request, this.token));

    try {
      const response = await axios({
        method,
        url,
        data: method === 'POST' || method === 'PUT' ? params : undefined,
        params: method === 'GET' ? params : undefined,
        headers: {
          Authorization: authHeader.Authorization,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Twitter Ads API error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async accountInfo(): Promise<any> {
    const result = await this.makeAPIRequest('GET', `/accounts/${this.accountId}`);
    
    // Also get funding info
    try {
      const funding = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/funding_instruments`);
      result.funding = funding;
    } catch (error) {
      // Funding info might not be available or accessible
      result.funding = { error: 'Unable to retrieve funding information' };
    }

    return result;
  }

  async campaignsList(): Promise<any> {
    const params = {
      account_id: this.accountId,
      with_deleted: false,
    };

    const campaigns = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/campaigns`, params);
    
    // Get metrics for each campaign
    if (campaigns.data && campaigns.data.length > 0) {
      for (const campaign of campaigns.data) {
        try {
          const metrics = await this.makeAPIRequest('GET', `/stats/accounts/${this.accountId}`, {
            entity: 'CAMPAIGN',
            entity_ids: campaign.id,
            start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_time: new Date().toISOString().split('T')[0],
            granularity: 'TOTAL',
            metric_groups: 'ENGAGEMENT,BILLING',
          });
          campaign.metrics = metrics.data?.[0]?.id_data?.[0]?.metrics || {};
        } catch (error) {
          campaign.metrics = { error: 'Unable to retrieve metrics' };
        }
      }
    }

    return campaigns;
  }

  async campaignCreate(name: string, objective: string, budgetAmount: string, startDate?: string, endDate?: string): Promise<any> {
    const campaignData: any = {
      account_id: this.accountId,
      name,
      funding_instrument_id: null, // Will need to be set based on available funding
      entity_status: 'PAUSED',
      objective: objective.toUpperCase(),
      start_time: startDate || new Date().toISOString(),
      total_budget_amount_local_micro: parseInt(budgetAmount) * 1000000, // Convert to micros
    };

    if (endDate) {
      campaignData.end_time = endDate;
    }

    // First, get available funding instruments
    try {
      const funding = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/funding_instruments`);
      if (funding.data && funding.data.length > 0) {
        campaignData.funding_instrument_id = funding.data[0].id;
      }
    } catch (error) {
      // Continue without funding instrument ID - might be set up differently
    }

    return await this.makeAPIRequest('POST', `/accounts/${this.accountId}/campaigns`, campaignData);
  }

  async campaignUpdate(campaignId: string, updates: any): Promise<any> {
    const updateData = {
      account_id: this.accountId,
      ...updates,
    };

    return await this.makeAPIRequest('PUT', `/accounts/${this.accountId}/campaigns/${campaignId}`, updateData);
  }

  async campaignPause(campaignId: string): Promise<any> {
    return await this.campaignUpdate(campaignId, { entity_status: 'PAUSED' });
  }

  async campaignEnable(campaignId: string): Promise<any> {
    return await this.campaignUpdate(campaignId, { entity_status: 'ACTIVE' });
  }

  async lineItemsList(campaignId: string): Promise<any> {
    const params = {
      account_id: this.accountId,
      campaign_ids: campaignId,
      with_deleted: false,
    };

    const lineItems = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/line_items`, params);

    // Get metrics for each line item
    if (lineItems.data && lineItems.data.length > 0) {
      for (const lineItem of lineItems.data) {
        try {
          const metrics = await this.makeAPIRequest('GET', `/stats/accounts/${this.accountId}`, {
            entity: 'LINE_ITEM',
            entity_ids: lineItem.id,
            start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_time: new Date().toISOString().split('T')[0],
            granularity: 'TOTAL',
            metric_groups: 'ENGAGEMENT,BILLING',
          });
          lineItem.metrics = metrics.data?.[0]?.id_data?.[0]?.metrics || {};
        } catch (error) {
          lineItem.metrics = { error: 'Unable to retrieve metrics' };
        }
      }
    }

    return lineItems;
  }

  async lineItemCreate(campaignId: string, name: string, bidAmount: string, targeting: any, placement: string): Promise<any> {
    const lineItemData = {
      account_id: this.accountId,
      campaign_id: campaignId,
      name,
      product_type: 'PROMOTED_TWEETS',
      placements: [placement.toUpperCase()],
      bid_amount_local_micro: parseInt(bidAmount) * 1000000,
      entity_status: 'PAUSED',
      ...targeting,
    };

    return await this.makeAPIRequest('POST', `/accounts/${this.accountId}/line_items`, lineItemData);
  }

  async promotedTweetsList(lineItemId?: string): Promise<any> {
    const params: any = {
      account_id: this.accountId,
      with_deleted: false,
    };

    if (lineItemId) {
      params.line_item_ids = lineItemId;
    }

    return await this.makeAPIRequest('GET', `/accounts/${this.accountId}/promoted_tweets`, params);
  }

  async promoteTweet(lineItemId: string, tweetId: string): Promise<any> {
    const promotedTweetData = {
      account_id: this.accountId,
      line_item_id: lineItemId,
      tweet_id: tweetId,
      entity_status: 'ACTIVE',
    };

    return await this.makeAPIRequest('POST', `/accounts/${this.accountId}/promoted_tweets`, promotedTweetData);
  }

  async targetingOptions(targetingType: string): Promise<any> {
    let endpoint = '';
    
    switch (targetingType.toLowerCase()) {
      case 'interests':
        endpoint = '/targeting_criteria/interests';
        break;
      case 'keywords':
        endpoint = '/targeting_criteria/keywords';
        break;
      case 'followers':
        endpoint = '/targeting_criteria/user_lookups';
        break;
      case 'locations':
        endpoint = '/targeting_criteria/locations';
        break;
      case 'devices':
        endpoint = '/targeting_criteria/devices';
        break;
      default:
        throw new Error(`Unknown targeting type: ${targetingType}`);
    }

    return await this.makeAPIRequest('GET', endpoint);
  }

  async audienceCreate(name: string, type: string, description?: string): Promise<any> {
    const audienceData: any = {
      account_id: this.accountId,
      name,
      audience_type: type.toUpperCase(),
    };

    if (description) {
      audienceData.description = description;
    }

    return await this.makeAPIRequest('POST', `/accounts/${this.accountId}/tailored_audiences`, audienceData);
  }

  async metrics(entityType: string, entityIds: string, startDate: string, endDate: string): Promise<any> {
    const params = {
      entity: entityType.toUpperCase(),
      entity_ids: entityIds,
      start_time: startDate,
      end_time: endDate,
      granularity: 'DAY',
      metric_groups: 'ENGAGEMENT,BILLING,VIDEO',
      placement: 'ALL_ON_TWITTER',
    };

    return await this.makeAPIRequest('GET', `/stats/accounts/${this.accountId}`, params);
  }

  async budgetUpdate(campaignId: string, newBudgetAmount: string): Promise<any> {
    return await this.campaignUpdate(campaignId, {
      total_budget_amount_local_micro: parseInt(newBudgetAmount) * 1000000,
    });
  }

  async report(startDate: string, endDate: string): Promise<any> {
    // Get campaigns
    const campaigns = await this.campaignsList();
    
    const summary = {
      date_range: { start: startDate, end: endDate },
      account_id: this.accountId,
      total_impressions: 0,
      total_engagements: 0,
      total_spend: 0,
      average_cpe: 0,
      campaigns: [] as any[],
    };

    if (campaigns.data && campaigns.data.length > 0) {
      // Get metrics for all campaigns
      const campaignIds = campaigns.data.map((c: any) => c.id).join(',');
      
      try {
        const metricsResult = await this.metrics('CAMPAIGN', campaignIds, startDate, endDate);
        
        // Process metrics
        const metricsMap = new Map();
        if (metricsResult.data) {
          metricsResult.data.forEach((item: any) => {
            if (item.id_data && item.id_data.length > 0) {
              item.id_data.forEach((data: any) => {
                metricsMap.set(data.id, data.metrics);
              });
            }
          });
        }

        // Combine campaign info with metrics
        campaigns.data.forEach((campaign: any) => {
          const metrics = metricsMap.get(campaign.id) || {};
          
          const campaignSummary = {
            id: campaign.id,
            name: campaign.name,
            status: campaign.entity_status,
            objective: campaign.objective,
            impressions: parseInt(metrics.impressions || 0),
            engagements: parseInt(metrics.engagements || 0),
            spend: parseFloat(metrics.billed_charge_local_micro || 0) / 1000000,
            cpe: metrics.engagements > 0 ? (parseFloat(metrics.billed_charge_local_micro || 0) / 1000000) / parseInt(metrics.engagements) : 0,
          };

          summary.campaigns.push(campaignSummary);
          summary.total_impressions += campaignSummary.impressions;
          summary.total_engagements += campaignSummary.engagements;
          summary.total_spend += campaignSummary.spend;
        });

        // Calculate average CPE
        summary.average_cpe = summary.total_engagements > 0 ? summary.total_spend / summary.total_engagements : 0;
      } catch (error) {
        summary.metrics_error = 'Unable to retrieve detailed metrics';
      }
    }

    return summary;
  }

  async funding(): Promise<any> {
    const fundingInstruments = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/funding_instruments`);
    
    // Get billing history if available
    try {
      const billing = await this.makeAPIRequest('GET', `/accounts/${this.accountId}/authenticated_user_access`);
      return {
        funding_instruments: fundingInstruments,
        billing_info: billing,
      };
    } catch (error) {
      return {
        funding_instruments: fundingInstruments,
        billing_info: { error: 'Unable to retrieve billing information' },
      };
    }
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
      throw new Error('No command specified. Available commands: account-info, campaigns-list, campaign-create, campaign-update, campaign-pause, campaign-enable, line-items-list, line-item-create, promoted-tweets-list, promote-tweet, targeting-options, audience-create, metrics, budget-update, report, funding');
    }

    const cli = new TwitterAdsCLI();
    let result: any;

    switch (command) {
      case 'account-info':
        result = await cli.accountInfo();
        break;

      case 'campaigns-list':
        result = await cli.campaignsList();
        break;

      case 'campaign-create':
        if (args.length < 4) throw new Error('Usage: campaign-create <name> <objective> <budget> [start_date] [end_date]');
        result = await cli.campaignCreate(args[1], args[2], args[3], args[4], args[5]);
        break;

      case 'campaign-update':
        if (args.length < 3) throw new Error('Usage: campaign-update <campaign_id> <field:value> [field2:value2...]');
        const updates: any = {};
        for (let i = 2; i < args.length; i++) {
          const [field, value] = args[i].split(':');
          updates[field] = value;
        }
        result = await cli.campaignUpdate(args[1], updates);
        break;

      case 'campaign-pause':
        if (args.length < 2) throw new Error('Usage: campaign-pause <campaign_id>');
        result = await cli.campaignPause(args[1]);
        break;

      case 'campaign-enable':
        if (args.length < 2) throw new Error('Usage: campaign-enable <campaign_id>');
        result = await cli.campaignEnable(args[1]);
        break;

      case 'line-items-list':
        if (args.length < 2) throw new Error('Usage: line-items-list <campaign_id>');
        result = await cli.lineItemsList(args[1]);
        break;

      case 'line-item-create':
        if (args.length < 5) throw new Error('Usage: line-item-create <campaign_id> <name> <bid_amount> <placement> [targeting_json]');
        const targeting = args[5] ? JSON.parse(args[5]) : {};
        result = await cli.lineItemCreate(args[1], args[2], args[3], targeting, args[4]);
        break;

      case 'promoted-tweets-list':
        result = await cli.promotedTweetsList(args[1]);
        break;

      case 'promote-tweet':
        if (args.length < 3) throw new Error('Usage: promote-tweet <line_item_id> <tweet_id>');
        result = await cli.promoteTweet(args[1], args[2]);
        break;

      case 'targeting-options':
        if (args.length < 2) throw new Error('Usage: targeting-options <type> (interests|keywords|followers|locations|devices)');
        result = await cli.targetingOptions(args[1]);
        break;

      case 'audience-create':
        if (args.length < 3) throw new Error('Usage: audience-create <name> <type> [description]');
        result = await cli.audienceCreate(args[1], args[2], args[3]);
        break;

      case 'metrics':
        if (args.length < 5) throw new Error('Usage: metrics <entity_type> <entity_ids> <start_date> <end_date>');
        result = await cli.metrics(args[1], args[2], args[3], args[4]);
        break;

      case 'budget-update':
        if (args.length < 3) throw new Error('Usage: budget-update <campaign_id> <new_budget>');
        result = await cli.budgetUpdate(args[1], args[2]);
        break;

      case 'report':
        if (args.length < 3) throw new Error('Usage: report <start_date> <end_date>');
        result = await cli.report(args[1], args[2]);
        break;

      case 'funding':
        result = await cli.funding();
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message || error.toString() }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error: any) => {
    console.error(JSON.stringify({ error: error.message || error.toString() }, null, 2));
    process.exit(1);
  });
}

export { TwitterAdsCLI };