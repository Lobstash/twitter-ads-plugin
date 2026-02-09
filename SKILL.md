# Twitter Ads CLI Skill

A comprehensive CLI for managing Twitter Ads campaigns, line items, promoted tweets, audiences, and analyzing advertising performance through the Twitter Ads API v12.

## Current Status

✅ **Working Features:**
- Account information and funding details
- Campaign management (list, create, update, pause, enable)
- Line item (ad set) management
- Promoted tweet creation and management
- Targeting options discovery
- Custom audience creation
- Performance metrics and analytics
- Budget management and updates
- Comprehensive reporting
- OAuth 1.0a authentication

⚠️ **Limited Features:**
- Advanced targeting requires manual JSON configuration
- Some audience types may require additional setup
- Video ads and creative management need extended implementation
- Bulk operations are limited by API rate limits

The implementation provides full Twitter Ads API functionality with proper OAuth authentication and comprehensive campaign management capabilities.

## Installation & Setup

```bash
cd /root/.openclaw/workspace/skills/twitter-ads/
npm install
```

## Environment Requirements

Requires these environment variables in `/root/.openclaw/.env`:
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET` 
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`
- `TWITTER_ADS_ACCOUNT_ID`

## Usage

All commands output structured JSON for easy parsing. Use the shell wrapper or direct invocation:

```bash
# Via shell wrapper (recommended)
./twitter-ads.sh <command> [args]

# Direct invocation
npx ts-node cli.ts <command> [args]
```

## Commands Reference

### Account Management

#### `twitter-ads account-info`
Get ads account details and funding information.

#### `twitter-ads funding`
Get detailed funding instruments and billing information.

### Campaign Management

#### `twitter-ads campaigns-list`
List all campaigns with status, metrics, and performance data.

#### `twitter-ads campaign-create <name> <objective> <budget> [start_date] [end_date]`
Create a new Twitter Ads campaign.
- `name`: Campaign name
- `objective`: Campaign objective (TWEET_ENGAGEMENTS, WEBSITE_CLICKS, FOLLOWERS, etc.)
- `budget`: Total budget in currency units
- `start_date`: Optional start date (ISO format)
- `end_date`: Optional end date (ISO format)

#### `twitter-ads campaign-update <campaign_id> <field:value> [field2:value2...]`
Update campaign settings.
- `campaign_id`: Campaign ID
- `field:value`: Field-value pairs to update

#### `twitter-ads campaign-pause <campaign_id>`
Pause a campaign.

#### `twitter-ads campaign-enable <campaign_id>`
Enable a paused campaign.

### Line Item Management

#### `twitter-ads line-items-list <campaign_id>`
List line items (ad sets) in a campaign.

#### `twitter-ads line-item-create <campaign_id> <name> <bid_amount> <placement> [targeting_json]`
Create a new line item.
- `campaign_id`: Parent campaign ID
- `name`: Line item name
- `bid_amount`: Bid amount in currency units
- `placement`: ALL_ON_TWITTER, PUBLISHER_NETWORK
- `targeting_json`: Optional targeting criteria as JSON

### Promoted Tweet Management

#### `twitter-ads promoted-tweets-list [line_item_id]`
List promoted tweets, optionally filtered by line item.

#### `twitter-ads promote-tweet <line_item_id> <tweet_id>`
Promote an existing tweet.
- `line_item_id`: Line item to associate with
- `tweet_id`: ID of tweet to promote

### Targeting & Audiences

#### `twitter-ads targeting-options <type>`
List available targeting criteria.
- `type`: interests, keywords, followers, locations, devices

#### `twitter-ads audience-create <name> <type> [description]`
Create a custom audience.
- `name`: Audience name
- `type`: CUSTOM, LOOKALIKE, etc.
- `description`: Optional description

### Analytics & Reporting

#### `twitter-ads metrics <entity_type> <entity_ids> <start_date> <end_date>`
Get performance metrics for entities.
- `entity_type`: CAMPAIGN, LINE_ITEM, PROMOTED_TWEET
- `entity_ids`: Comma-separated entity IDs
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

#### `twitter-ads report <start_date> <end_date>`
Generate a comprehensive performance report.

#### `twitter-ads budget-update <campaign_id> <new_budget>`
Update campaign budget.

## Example Usage

```bash
# Get account information
./twitter-ads.sh account-info

# List all campaigns
./twitter-ads.sh campaigns-list

# Create a new campaign
./twitter-ads.sh campaign-create "Summer Sale 2024" WEBSITE_CLICKS 1000 "2024-06-01T00:00:00Z" "2024-08-31T23:59:59Z"

# Create a line item
./twitter-ads.sh line-item-create 123456789 "Summer Sale Ads" 5 ALL_ON_TWITTER '{"locations": ["us"], "age": ["25-49"]}'

# Promote a tweet
./twitter-ads.sh promote-tweet 987654321 "1234567890123456789"

# Get campaign metrics
./twitter-ads.sh metrics CAMPAIGN 123456789 2024-01-01 2024-01-31

# Generate monthly report
./twitter-ads.sh report 2024-01-01 2024-01-31

# Update campaign budget
./twitter-ads.sh budget-update 123456789 1500

# Check targeting options
./twitter-ads.sh targeting-options interests

# Create custom audience
./twitter-ads.sh audience-create "Website Visitors" CUSTOM "People who visited our website"
```

## Advanced Usage Examples

### Campaign Optimization Workflow
```bash
# 1. Analyze current performance
./twitter-ads.sh report $(date -d '30 days ago' +%Y-%m-%d) $(date +%Y-%m-%d) > monthly_report.json

# 2. Identify top performing campaigns
jq '.campaigns[] | select(.engagements > 1000 and .cpe < 0.50) | .name, .cpe' monthly_report.json

# 3. Increase budget for high performers
./twitter-ads.sh budget-update 123456789 2000

# 4. Pause underperforming campaigns
./twitter-ads.sh campaign-pause 987654321

# 5. Create new line items for successful campaigns
./twitter-ads.sh line-item-create 123456789 "Retargeting Audience" 7.50 ALL_ON_TWITTER '{"behaviors": ["engaged_with_your_tweets"]}'
```

### Tweet Promotion Automation
```bash
# 1. Find high-performing organic tweets (requires Twitter API)
# 2. Promote top tweets
./twitter-ads.sh promote-tweet 987654321 "high_performing_tweet_id_1"
./twitter-ads.sh promote-tweet 987654321 "high_performing_tweet_id_2"

# 3. Monitor promoted tweet performance
./twitter-ads.sh metrics PROMOTED_TWEET "promo_tweet_1,promo_tweet_2" $(date -d '7 days ago' +%Y-%m-%d) $(date +%Y-%m-%d)
```

### Audience Development
```bash
# 1. Create custom audiences
./twitter-ads.sh audience-create "High Value Customers" CUSTOM "Customers with >$500 LTV"
./twitter-ads.sh audience-create "Website Visitors" CUSTOM "Recent website traffic"

# 2. Check available targeting options
./twitter-ads.sh targeting-options interests > interests.json
./twitter-ads.sh targeting-options keywords > keywords.json

# 3. Create targeted campaigns
./twitter-ads.sh campaign-create "Lookalike Campaign" FOLLOWERS 500
./twitter-ads.sh line-item-create new_campaign_id "Lookalike Targeting" 3.00 ALL_ON_TWITTER '{"tailored_audiences": ["lookalike_audience_id"]}'
```

## Rate Limits & Best Practices

### Twitter Ads API Rate Limits
- **Standard Requests**: 1,000 requests per 15-minute window
- **Analytics Requests**: 50 requests per 15-minute window  
- **Creation Operations**: Lower limits vary by account

### Best Practices
- **Campaign Structure**: Use clear naming conventions
- **Budget Management**: Start with smaller budgets and scale up
- **Targeting**: Start broad, then narrow based on performance
- **Creative Testing**: Test multiple ad variations
- **Performance Monitoring**: Check metrics daily during active campaigns

### Optimization Guidelines
```bash
# Daily performance check
./twitter-ads.sh report $(date -d '1 day ago' +%Y-%m-%d) $(date +%Y-%m-%d) | jq '.campaigns[] | {name, spend, engagements, cpe}'

# Weekly optimization review
./twitter-ads.sh report $(date -d '7 days ago' +%Y-%m-%d) $(date +%Y-%m-%d) | jq '.campaigns[] | select(.engagements > 100) | {name, cpe, spend}'

# Pause campaigns with high spend and low engagement
./twitter-ads.sh campaigns-list | jq -r '.data[] | select(.metrics.billed_charge_local_micro > 10000000 and .metrics.engagements < 50) | .id' | while read id; do ./twitter-ads.sh campaign-pause $id; done
```

## Error Handling

Common error scenarios and solutions:

**Authentication errors**:
```json
{
  "error": "Twitter Ads API error: Unauthorized"
}
```
- Verify all API credentials are correct
- Ensure account has Twitter Ads access
- Check that tokens haven't expired

**Account access errors**:
```json
{
  "error": "Twitter Ads API error: Account not found"
}
```
- Verify TWITTER_ADS_ACCOUNT_ID is correct
- Ensure account is properly set up for advertising
- Check that you have access to the ads account

**Budget/billing errors**:
```json
{
  "error": "Twitter Ads API error: Insufficient funds"
}
```
- Add funding to your Twitter Ads account
- Verify payment methods are valid
- Check account billing status

## Integration with Other Tools

**Export metrics to CSV**:
```bash
./twitter-ads.sh campaigns-list | jq -r '.data[] | [.name, .entity_status, .metrics.impressions, .metrics.engagements, .metrics.billed_charge_local_micro] | @csv' > campaigns.csv
```

**Automated reporting**:
```bash
# Daily report email
./twitter-ads.sh report $(date -d '1 day ago' +%Y-%m-%d) $(date +%Y-%m-%d) | mail -s "Daily Twitter Ads Report" admin@example.com
```

**Webhook integration**:
```bash
# Send performance alerts
./twitter-ads.sh report $(date -d '1 day ago' +%Y-%m-%d) $(date +%Y-%m-%d) | curl -X POST https://your-webhook.com -d @-
```

**Budget monitoring**:
```bash
# Alert on high spend campaigns
./twitter-ads.sh campaigns-list | jq '.data[] | select(.metrics.billed_charge_local_micro > 50000000) | .name, .metrics.billed_charge_local_micro'
```

## Performance Optimization

### Cost Optimization
- Monitor Cost Per Engagement (CPE) daily
- Pause underperforming line items quickly
- Adjust bids based on performance data
- Use dayparting to optimize timing

### Engagement Optimization  
- Test different creative formats
- Refine targeting based on audience insights
- A/B test different objectives
- Optimize for engagement quality over quantity

### Scaling Strategies
- Gradually increase budgets for winning campaigns
- Expand targeting for successful audiences  
- Create lookalike audiences from converters
- Test new placements and formats