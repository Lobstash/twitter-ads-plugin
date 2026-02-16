# Twitter Ads CLI

A comprehensive CLI for managing Twitter advertising campaigns, targeting, and analytics through the Twitter Ads API.

## Features

- **Campaign Management**: Create, update, and manage advertising campaigns
- **Targeting**: Set up precise audience targeting and demographics
- **Analytics**: Track performance metrics and campaign insights
- **Budget Control**: Manage campaign budgets and bid strategies
- **Creative Management**: Handle ad creatives and promotional content

## Installation

```bash
cd ~/.openclaw/skills/twitter-ads/
npm install
```

## Environment Variables

Set these in your OpenClaw `.env` file:

```bash
TWITTER_ADS_ACCESS_TOKEN=your_access_token
TWITTER_ADS_ACCESS_SECRET=your_access_secret  
TWITTER_ADS_CONSUMER_KEY=your_consumer_key
TWITTER_ADS_CONSUMER_SECRET=your_consumer_secret
```

## Usage

```bash
./twitter-ads.sh <command> [options]
# or
npx ts-node cli.ts <command> [options]
```

## Available Commands

- `campaigns` - List all advertising campaigns
- `create-campaign` - Create a new advertising campaign
- `update-campaign` - Update campaign settings
- `analytics` - Get campaign performance metrics
- `targeting` - Manage audience targeting options
- `budget` - View and update campaign budgets

All commands output structured JSON for easy parsing and integration.

## Authentication

This CLI uses OAuth 1.0a authentication with the Twitter Ads API. You'll need to:

1. Create a Twitter Ads API application
2. Generate access tokens and secrets
3. Set the required environment variables

See `setup.md` for detailed authentication setup instructions.

## Requirements

- Node.js 18+ 
- Valid Twitter Ads API credentials
- OpenClaw environment with proper permissions