# Google Ads API Integration Setup Guide

## Overview

This integration automatically fetches:
- **Change History**: Recent changes made to campaigns, bids, budgets, keywords, etc.
- **Auction Insights**: Impression share, top of page rate, competitive metrics

## Setup Instructions

### 1. Get Google Ads API Credentials

#### Step 1: Enable Google Ads API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Google Ads API** for your project
4. Navigate to **APIs & Services > Credentials**

#### Step 2: Create OAuth 2.0 Client
1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Application type: **Web application**
3. Add redirect URI: `http://localhost`
4. Save your **Client ID** and **Client Secret**

#### Step 3: Get Developer Token
1. Go to [Google Ads](https://ads.google.com/)
2. Navigate to **Tools & Settings** → **Setup** → **API Center**
3. Apply for **Developer Token**
4. Wait for approval (can take 1-2 days for production access)
   - Test access is instant but limited to test accounts

#### Step 4: Generate Refresh Token
Use this script to generate a refresh token:

```bash
# Install the Google Ads API library globally
npm install -g google-ads-api

# Run the authentication helper
google-ads-api authenticate \
  --client-id="YOUR_CLIENT_ID" \
  --client-secret="YOUR_CLIENT_SECRET"
```

Follow the prompts:
1. Browser will open asking you to authorize
2. Copy the authorization code
3. The tool will output your **Refresh Token**

#### Step 5: Get Customer ID
1. Log into [Google Ads](https://ads.google.com/)
2. Your Customer ID is in the top right corner (format: 123-456-7890)
3. Remove the dashes: `1234567890`

### 2. Configure Environment Variables

Update your `.env` file with the credentials:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890
```

**Notes:**
- `GOOGLE_ADS_CUSTOMER_ID`: The main account you want to query
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`: Usually the same as CUSTOMER_ID (manager account if using MCC)

### 3. Test the Integration

1. Run the app: `npm run dev`
2. Run an analysis with your target date
3. Click on the **"Google Ads"** tab
4. You should see:
   - Change History with recent modifications
   - Auction Insights with impression share trends

## What Data is Fetched

### Change History
Shows all changes in the last 7 days:
- **Bid changes** (before/after values)
- **Budget modifications**
- **Campaign status changes** (enabled/paused)
- **Keyword additions/removals**
- **Ad copy changes**
- **Targeting adjustments**

Each change includes:
- Timestamp
- User who made the change
- Campaign/Ad Group name
- Old and new values

### Auction Insights
Daily metrics for the date range:
- **Impression Share** (%)
- **Top of Page Rate** (%)
- **Absolute Top Impression** (%)
- Averages across all campaigns

## Troubleshooting

### "Google Ads API credentials not configured"
**Solution**: Make sure all environment variables are set in `.env` and restart the dev server.

### "Invalid developer token"
**Solution**: Your developer token might not be approved yet. Apply for production access in Google Ads API Center.

### "Customer not found"
**Solution**: Double-check your Customer ID (remove dashes). Make sure your refresh token has access to this account.

### "Insufficient permissions"
**Solution**: The Google account used for OAuth must have access to the Google Ads account. Grant read access in Google Ads user settings.

### "quota exceeded"
**Solution**: Google Ads API has rate limits:
- Developer tokens: 15,000 operations/day
- Basic access: Higher limits after approval

## API Endpoints

### `/api/google-ads`
**Method**: POST

**Request Body**:
```json
{
  "targetDate": "2024-12-03",
  "lookbackDays": 7
}
```

**Response**:
```json
{
  "changeHistory": [
    {
      "changeDateTime": "2024-12-02T10:30:00Z",
      "changeResourceType": "CAMPAIGN_BUDGET",
      "userEmail": "user@example.com",
      "oldValue": "$100",
      "newValue": "$150",
      "campaignName": "Campaign 123"
    }
  ],
  "auctionInsights": [
    {
      "date": "2024-12-01",
      "impressionShare": 75.5,
      "topOfPageRate": 65.2,
      "absoluteTopImpressionPercentage": 45.8
    }
  ]
}
```

## Files Created

1. **`lib/google-ads.ts`**: Google Ads API client and data fetching functions
2. **`app/api/google-ads/route.ts`**: API endpoint for fetching Google Ads data
3. **`components/GoogleAdsAnalysisTable.tsx`**: UI component displaying the data
4. **`.env`**: Environment variables (add your credentials here)

## Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [google-ads-api NPM Package](https://www.npmjs.com/package/google-ads-api)
- [API Reference](https://developers.google.com/google-ads/api/reference/rpc/v16/overview)
- [OAuth 2.0 Setup](https://developers.google.com/google-ads/api/docs/oauth/overview)

## Future Enhancements (Not Yet Implemented)

- **Seasonality Detection**: Historical pattern analysis
- **Automated Recommendations**: AI-powered suggestions based on changes
- **Change Impact Analysis**: Correlate changes with metric movements
- **Bulk Change History**: View changes across multiple accounts
