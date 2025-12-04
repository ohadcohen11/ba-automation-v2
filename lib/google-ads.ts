// OAuth2 Token Cache
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Get a fresh access token using the refresh token
 * Implements token caching to avoid unnecessary refresh calls
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAccessToken && Date.now() < tokenExpiryTime - 300000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';

  console.log('🔄 Refreshing Google Ads access token...');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  const accessToken = data.access_token as string;
  cachedAccessToken = accessToken;

  // Token typically expires in 3600 seconds (1 hour)
  tokenExpiryTime = Date.now() + (data.expires_in || 3600) * 1000;

  console.log('✅ Access token refreshed successfully');
  return accessToken;
}

/**
 * Execute a Google Ads query using the REST API
 */
async function executeQuery(query: string): Promise<any[]> {
  const accessToken = await getAccessToken();
  // Use the Dating US account ID (not the login customer ID)
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '7845147076';
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '1594544706';
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';

  const url = `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:searchStream`;

  console.log(`📡 Google Ads API Request: customer=${customerId}, login-customer=${loginCustomerId}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'developer-token': developerToken,
      'login-customer-id': loginCustomerId,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // The searchStream response returns an array of result objects
  // Each result has a 'results' array with the actual data
  const results: any[] = [];
  if (Array.isArray(data)) {
    data.forEach((batch: any) => {
      if (batch.results) {
        results.push(...batch.results);
      }
    });
  }

  return results;
}

// Change History Types
export interface ChangeEvent {
  changeDateTime: string;
  changeResourceName: string;
  changeResourceType: string;
  userEmail: string;
  oldValue?: string;
  newValue?: string;
  campaignName?: string;
  adGroupName?: string;
  resourceChangeName?: string;
}

// Auction Insights Types
export interface AuctionInsightsMetrics {
  date: string;
  impressionShare: number;
  averagePosition: number;
  overlapRate: number;
  positionAboveRate: number;
  topOfPageRate: number;
  absoluteTopImpressionPercentage: number;
}

// Campaign Metrics Types
export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  date: string;
  device: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  cpc: number;
  cvr: number;
}

// Anomaly Types
export interface Anomaly {
  metric: string;
  current: string | number;
  baseline: string | number;
  changePercent: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
}

// Significant Change Types
export interface SignificantChange {
  type: 'BUDGET' | 'BID' | 'SCHEDULE' | 'TARGET_CPA' | 'BID_STRATEGY';
  date: string;
  user: string;
  oldValue?: string;
  newValue?: string;
  changePercent?: number;
  isSignificant: boolean;
  campaignName?: string;
  description: string;
}

/**
 * Fetch Change History from Google Ads
 * Returns changes within the specified date range
 */
export async function fetchChangeHistory(
  startDate: string,
  endDate: string
): Promise<ChangeEvent[]> {
  try {
    // Query for change events
    const query = `
      SELECT
        change_event.change_date_time,
        change_event.change_resource_name,
        change_event.change_resource_type,
        change_event.user_email,
        change_event.old_resource,
        change_event.new_resource,
        change_event.resource_change_operation,
        change_event.campaign,
        change_event.ad_group
      FROM change_event
      WHERE change_event.change_date_time >= '${startDate}'
        AND change_event.change_date_time <= '${endDate}'
      ORDER BY change_event.change_date_time DESC
      LIMIT 100
    `;

    const response = await executeQuery(query);

    const changes: ChangeEvent[] = response.map((row: any) => {
      const event = row.changeEvent;

      return {
        changeDateTime: event.changeDateTime || '',
        changeResourceName: event.changeResourceName || '',
        changeResourceType: event.changeResourceType || '',
        userEmail: event.userEmail || 'Unknown',
        oldValue: event.oldResource || undefined,
        newValue: event.newResource || undefined,
        campaignName: event.campaign ? extractCampaignName(event.campaign) : undefined,
        adGroupName: event.adGroup ? extractAdGroupName(event.adGroup) : undefined,
        resourceChangeName: extractResourceName(event.changeResourceName || ''),
      };
    });

    return changes;
  } catch (error) {
    console.error('Error fetching Google Ads change history:', error);
    throw new Error(`Failed to fetch change history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch Auction Insights metrics
 * Returns impression share and competitive metrics
 */
export async function fetchAuctionInsights(
  startDate: string,
  endDate: string
): Promise<AuctionInsightsMetrics[]> {
  try {
    // Query for auction insights metrics
    const query = `
      SELECT
        segments.date,
        metrics.search_impression_share,
        metrics.search_rank_lost_impression_share,
        metrics.search_absolute_top_impression_share,
        metrics.search_top_impression_share,
        campaign.name
      FROM campaign
      WHERE segments.date >= '${startDate}'
        AND segments.date <= '${endDate}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `;

    const response = await executeQuery(query);

    // Aggregate metrics by date
    const metricsByDate = new Map<string, {
      impressionShare: number[];
      absoluteTop: number[];
      topOfPage: number[];
      count: number;
    }>();

    response.forEach((row: any) => {
      const date = row.segments?.date;
      const metrics = row.metrics;

      if (!date) return;

      if (!metricsByDate.has(date)) {
        metricsByDate.set(date, {
          impressionShare: [],
          absoluteTop: [],
          topOfPage: [],
          count: 0,
        });
      }

      const data = metricsByDate.get(date)!;

      if (metrics?.searchImpressionShare !== undefined) {
        data.impressionShare.push(parseFloat(metrics.searchImpressionShare) * 100);
      }
      if (metrics?.searchAbsoluteTopImpressionShare !== undefined) {
        data.absoluteTop.push(parseFloat(metrics.searchAbsoluteTopImpressionShare) * 100);
      }
      if (metrics?.searchTopImpressionShare !== undefined) {
        data.topOfPage.push(parseFloat(metrics.searchTopImpressionShare) * 100);
      }
      data.count++;
    });

    // Calculate averages
    const insights: AuctionInsightsMetrics[] = Array.from(metricsByDate.entries()).map(
      ([date, data]) => ({
        date,
        impressionShare: average(data.impressionShare),
        averagePosition: 0, // Not directly available in newer API
        overlapRate: 0, // Requires auction insights report
        positionAboveRate: 0, // Requires auction insights report
        topOfPageRate: average(data.topOfPage),
        absoluteTopImpressionPercentage: average(data.absoluteTop),
      })
    );

    return insights.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching Google Ads auction insights:', error);
    throw new Error(`Failed to fetch auction insights: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch detailed Auction Insights Report
 * This provides competitive metrics including overlap rate
 */
export async function fetchAuctionInsightsReport(
  startDate: string,
  endDate: string
): Promise<any[]> {
  try {
    // Query for auction insights report
    const query = `
      SELECT
        auction_insight_search_term_view.date,
        auction_insight_search_term_view.device,
        auction_insight_search_term_view.domain,
        auction_insight_search_term_view.impression_share,
        auction_insight_search_term_view.overlap_rate,
        auction_insight_search_term_view.position_above_rate,
        auction_insight_search_term_view.top_of_page_rate,
        auction_insight_search_term_view.absolute_top_of_page_rate
      FROM auction_insight_search_term_view
      WHERE auction_insight_search_term_view.date >= '${startDate}'
        AND auction_insight_search_term_view.date <= '${endDate}'
      ORDER BY auction_insight_search_term_view.date DESC
      LIMIT 100
    `;

    const response = await executeQuery(query);
    return response;
  } catch (error) {
    console.error('Error fetching auction insights report:', error);
    // This might fail if auction insights are not available
    return [];
  }
}

// Helper functions
function extractCampaignName(campaignResource: string): string {
  // Extract campaign name from resource string
  const match = campaignResource.match(/campaigns\/(\d+)/);
  return match ? `Campaign ${match[1]}` : 'Unknown Campaign';
}

function extractAdGroupName(adGroupResource: string): string {
  // Extract ad group name from resource string
  const match = adGroupResource.match(/adGroups\/(\d+)/);
  return match ? `Ad Group ${match[1]}` : 'Unknown Ad Group';
}

function extractResourceName(resourceName: string): string {
  // Extract readable name from resource path
  const parts = resourceName.split('/');
  return parts[parts.length - 1] || resourceName;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Fetch Campaign Metrics (clicks, cost, conversions)
 * Returns daily metrics aggregated by campaign and device
 */
export async function fetchCampaignMetrics(
  startDate: string,
  endDate: string
): Promise<CampaignMetrics[]> {
  try {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date >= '${startDate}'
        AND segments.date <= '${endDate}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `;

    const response = await executeQuery(query);

    const metrics: CampaignMetrics[] = response.map((row: any) => {
      const cost = parseFloat(row.metrics?.costMicros || 0) / 1000000;
      const clicks = parseInt(row.metrics?.clicks || 0);
      const conversions = parseFloat(row.metrics?.conversions || 0);

      return {
        campaignId: row.campaign?.id?.toString() || '',
        campaignName: row.campaign?.name || '',
        date: row.segments?.date || '',
        device: row.segments?.device || '',
        impressions: parseInt(row.metrics?.impressions || 0),
        clicks,
        cost,
        conversions,
        cpc: clicks > 0 ? cost / clicks : 0,
        cvr: clicks > 0 ? conversions / clicks : 0,
      };
    });

    return metrics;
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    throw new Error(`Failed to fetch campaign metrics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Detect Significant Changes in settings
 * Identifies budget, bid, and schedule changes with thresholds
 */
export async function detectSignificantChanges(
  startDate: string,
  endDate: string
): Promise<SignificantChange[]> {
  try {
    const query = `
      SELECT
        change_event.change_date_time,
        change_event.change_resource_name,
        change_event.change_resource_type,
        change_event.user_email,
        change_event.changed_fields,
        change_event.old_resource,
        change_event.new_resource,
        change_event.campaign
      FROM change_event
      WHERE change_event.change_date_time >= '${startDate}'
        AND change_event.change_date_time <= '${endDate}'
      ORDER BY change_event.change_date_time DESC
      LIMIT 200
    `;

    const response = await executeQuery(query);
    const significantChanges: SignificantChange[] = [];

    response.forEach((row: any) => {
      const event = row.changeEvent;
      const changedFields = event?.changedFields || [];

      // Budget Changes (≥20% threshold)
      if (event?.changeResourceType === 'CAMPAIGN_BUDGET' &&
          changedFields.some((f: string) => f.includes('amount_micros'))) {
        const oldBudget = parseFloat(event.oldResource?.campaignBudget?.amountMicros || 0) / 1000000;
        const newBudget = parseFloat(event.newResource?.campaignBudget?.amountMicros || 0) / 1000000;

        if (oldBudget > 0) {
          const changePercent = ((newBudget - oldBudget) / oldBudget) * 100;

          if (Math.abs(changePercent) >= 20) {
            significantChanges.push({
              type: 'BUDGET',
              date: event.changeDateTime || '',
              user: event.userEmail || 'Unknown',
              oldValue: `$${oldBudget.toFixed(2)}`,
              newValue: `$${newBudget.toFixed(2)}`,
              changePercent,
              isSignificant: true,
              campaignName: event.campaign ? extractCampaignName(event.campaign) : undefined,
              description: `Budget changed by ${changePercent.toFixed(1)}% (${changePercent > 0 ? 'increase' : 'decrease'})`,
            });
          }
        }
      }

      // Bid Modifier Changes (≥5% threshold)
      if (changedFields.some((f: string) => f.includes('bid_modifier'))) {
        const oldModifier = parseFloat(event?.oldResource?.campaignCriterion?.bidModifier || 1.0);
        const newModifier = parseFloat(event?.newResource?.campaignCriterion?.bidModifier || 1.0);

        const changePercent = ((newModifier - oldModifier) / oldModifier) * 100;

        if (Math.abs(changePercent) >= 5) {
          significantChanges.push({
            type: 'BID',
            date: event?.changeDateTime || '',
            user: event?.userEmail || 'Unknown',
            oldValue: `${(oldModifier * 100).toFixed(0)}%`,
            newValue: `${(newModifier * 100).toFixed(0)}%`,
            changePercent,
            isSignificant: true,
            campaignName: event?.campaign ? extractCampaignName(event.campaign) : undefined,
            description: `Bid modifier changed by ${changePercent.toFixed(1)}%`,
          });
        }
      }

      // Target CPA Changes (≥5% threshold)
      if (changedFields.some((f: string) => f.includes('target_cpa'))) {
        const oldCPA = parseFloat(event?.oldResource?.campaign?.targetCpa?.targetCpaMicros || 0) / 1000000;
        const newCPA = parseFloat(event?.newResource?.campaign?.targetCpa?.targetCpaMicros || 0) / 1000000;

        if (oldCPA > 0) {
          const changePercent = ((newCPA - oldCPA) / oldCPA) * 100;

          if (Math.abs(changePercent) >= 5) {
            significantChanges.push({
              type: 'TARGET_CPA',
              date: event?.changeDateTime || '',
              user: event?.userEmail || 'Unknown',
              oldValue: `$${oldCPA.toFixed(2)}`,
              newValue: `$${newCPA.toFixed(2)}`,
              changePercent,
              isSignificant: true,
              campaignName: event?.campaign ? extractCampaignName(event.campaign) : undefined,
              description: `Target CPA changed by ${changePercent.toFixed(1)}%`,
            });
          }
        }
      }

      // Schedule Changes (any change is significant)
      if (changedFields.some((f: string) => f.includes('ad_schedule'))) {
        significantChanges.push({
          type: 'SCHEDULE',
          date: event?.changeDateTime || '',
          user: event?.userEmail || 'Unknown',
          isSignificant: true,
          campaignName: event?.campaign ? extractCampaignName(event.campaign) : undefined,
          description: 'Ad schedule was modified',
        });
      }

      // Bid Strategy Changes (any change is significant)
      if (changedFields.some((f: string) => f.includes('bidding_strategy'))) {
        significantChanges.push({
          type: 'BID_STRATEGY',
          date: event?.changeDateTime || '',
          user: event?.userEmail || 'Unknown',
          isSignificant: true,
          campaignName: event?.campaign ? extractCampaignName(event.campaign) : undefined,
          description: 'Bidding strategy was changed',
        });
      }
    });

    return significantChanges;
  } catch (error) {
    console.error('Error detecting significant changes:', error);
    throw new Error(`Failed to detect changes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Detect Anomalies in metrics
 * Compares current period vs baseline and identifies significant changes
 */
export async function detectAnomalies(
  currentStartDate: string,
  currentEndDate: string,
  baselineStartDate: string,
  baselineEndDate: string
): Promise<Anomaly[]> {
  try {
    const [currentMetrics, baselineMetrics, currentIS, baselineIS] = await Promise.all([
      fetchCampaignMetrics(currentStartDate, currentEndDate),
      fetchCampaignMetrics(baselineStartDate, baselineEndDate),
      fetchAuctionInsights(currentStartDate, currentEndDate),
      fetchAuctionInsights(baselineStartDate, baselineEndDate),
    ]);

    const anomalies: Anomaly[] = [];

    // Calculate aggregate CPC
    const currentCPC = calculateAverageCPC(currentMetrics);
    const baselineCPC = calculateAverageCPC(baselineMetrics);

    if (baselineCPC > 0) {
      const cpcChange = ((currentCPC - baselineCPC) / baselineCPC) * 100;

      if (Math.abs(cpcChange) >= 5) {
        anomalies.push({
          metric: 'CPC (Cost Per Click)',
          current: `$${currentCPC.toFixed(2)}`,
          baseline: `$${baselineCPC.toFixed(2)}`,
          changePercent: cpcChange,
          severity: Math.abs(cpcChange) >= 10 ? 'CRITICAL' : 'WARNING',
          description: `CPC ${cpcChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(cpcChange).toFixed(1)}%`,
        });
      }
    }

    // Calculate aggregate CVR
    const currentCVR = calculateAverageCVR(currentMetrics);
    const baselineCVR = calculateAverageCVR(baselineMetrics);

    if (baselineCVR > 0) {
      const cvrChange = ((currentCVR - baselineCVR) / baselineCVR) * 100;

      if (Math.abs(cvrChange) >= 5) {
        anomalies.push({
          metric: 'CVR (Conversion Rate)',
          current: `${(currentCVR * 100).toFixed(2)}%`,
          baseline: `${(baselineCVR * 100).toFixed(2)}%`,
          changePercent: cvrChange,
          severity: Math.abs(cvrChange) >= 10 ? 'CRITICAL' : 'WARNING',
          description: `CVR ${cvrChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(cvrChange).toFixed(1)}%`,
        });
      }
    }

    // Calculate aggregate Impression Share
    const currentAvgIS = currentIS.length > 0
      ? currentIS.reduce((sum, i) => sum + i.impressionShare, 0) / currentIS.length
      : 0;
    const baselineAvgIS = baselineIS.length > 0
      ? baselineIS.reduce((sum, i) => sum + i.impressionShare, 0) / baselineIS.length
      : 0;

    if (baselineAvgIS > 0) {
      const isChangePercentagePoints = currentAvgIS - baselineAvgIS;

      if (Math.abs(isChangePercentagePoints) >= 10) {
        anomalies.push({
          metric: 'Impression Share',
          current: `${currentAvgIS.toFixed(1)}%`,
          baseline: `${baselineAvgIS.toFixed(1)}%`,
          changePercent: isChangePercentagePoints,
          severity: 'WARNING',
          description: `Impression Share ${isChangePercentagePoints > 0 ? 'increased' : 'decreased'} by ${Math.abs(isChangePercentagePoints).toFixed(1)} percentage points`,
        });
      }
    }

    // Calculate total conversions change
    const currentConversions = currentMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const baselineConversions = baselineMetrics.reduce((sum, m) => sum + m.conversions, 0);

    if (baselineConversions > 0) {
      const convChange = ((currentConversions - baselineConversions) / baselineConversions) * 100;

      if (Math.abs(convChange) >= 10) {
        anomalies.push({
          metric: 'Total Conversions',
          current: currentConversions.toFixed(0),
          baseline: baselineConversions.toFixed(0),
          changePercent: convChange,
          severity: Math.abs(convChange) >= 20 ? 'CRITICAL' : 'WARNING',
          description: `Conversions ${convChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(convChange).toFixed(1)}%`,
        });
      }
    }

    // Calculate total cost change
    const currentCost = currentMetrics.reduce((sum, m) => sum + m.cost, 0);
    const baselineCost = baselineMetrics.reduce((sum, m) => sum + m.cost, 0);

    if (baselineCost > 0) {
      const costChange = ((currentCost - baselineCost) / baselineCost) * 100;

      if (Math.abs(costChange) >= 10) {
        anomalies.push({
          metric: 'Total Cost',
          current: `$${currentCost.toFixed(2)}`,
          baseline: `$${baselineCost.toFixed(2)}`,
          changePercent: costChange,
          severity: Math.abs(costChange) >= 20 ? 'CRITICAL' : 'WARNING',
          description: `Total spend ${costChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(costChange).toFixed(1)}%`,
        });
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper functions for anomaly detection
function calculateAverageCPC(metrics: CampaignMetrics[]): number {
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  return totalClicks > 0 ? totalCost / totalClicks : 0;
}

function calculateAverageCVR(metrics: CampaignMetrics[]): number {
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  return totalClicks > 0 ? totalConversions / totalClicks : 0;
}
