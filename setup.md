# Twitter Ads Setup Guide

This guide walks you through setting up the Twitter Ads CLI for campaign management and analytics.

## Prerequisites

- Twitter Ads account with API access
- Node.js 18 or higher
- OpenClaw environment configured

## Step 1: Twitter Ads API Application

1. Visit the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Enable "Twitter Ads API" access in your app settings
4. Note down your:
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)

## Step 2: Authentication Setup

Twitter Ads API uses OAuth 1.0a. You'll need to generate access tokens:

1. In your Twitter Developer app, go to "Keys and tokens"
2. Generate "Access Token and Secret"
3. Save these credentials securely

## Step 3: Environment Configuration

Add these variables to your OpenClaw `.env` file:

```bash
# Twitter Ads API Credentials
TWITTER_ADS_CONSUMER_KEY=your_api_key_here
TWITTER_ADS_CONSUMER_SECRET=your_api_secret_here
TWITTER_ADS_ACCESS_TOKEN=your_access_token_here
TWITTER_ADS_ACCESS_SECRET=your_access_token_secret_here
```

## Step 4: Installation

```bash
cd ~/.openclaw/skills/twitter-ads/
npm install
```

## Step 5: Test Connection

Test your setup:

```bash
./twitter-ads.sh campaigns
```

This should return a JSON list of your advertising campaigns.

## API Rate Limits

Twitter Ads API has rate limits:
- 1000 requests per 15-minute window per endpoint
- Some endpoints have lower limits
- The CLI automatically handles rate limiting

## Permissions Required

Your Twitter account needs:
- Twitter Ads API access (requires approval)
- Campaign management permissions
- Read access to analytics data

## Troubleshooting

**Authentication Error**: Check that all 4 environment variables are set correctly

**Rate Limit Error**: Wait for the rate limit window to reset (15 minutes)

**Permission Denied**: Ensure your Twitter Ads API access is approved and active

**Campaign Not Found**: Verify you have campaigns in your Twitter Ads account

## Security Notes

- Never commit API credentials to version control
- Use environment variables for all sensitive data
- Rotate tokens periodically for security
- Monitor API usage to prevent unexpected charges

## Support

For Twitter Ads API specific issues:
- [Twitter Developer Documentation](https://developer.twitter.com/en/docs/twitter-ads-api)
- [Twitter Ads Help Center](https://business.twitter.com/en/help.html)