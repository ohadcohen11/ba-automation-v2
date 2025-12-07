import { NextRequest, NextResponse } from 'next/server';
import {
  fetchChangeHistory,
  fetchAuctionInsights,
  fetchAuctionInsightsReport,
  fetchCampaignMetrics,
  fetchKeywordMetrics,
  fetchSearchTerms,
  fetchAdMetrics,
  fetchGeoMetrics,
  fetchTimeMetrics,
  fetchDemographics,
  detectAnomalies,
  detectSignificantChanges,
  ChangeEvent,
  AuctionInsightsMetrics,
  CampaignMetrics,
  KeywordMetrics,
  SearchTermMetrics,
  AdMetrics,
  GeoMetrics,
  TimeMetrics,
  DemographicMetrics,
  Anomaly,
  SignificantChange,
} from '@/lib/google-ads';

export interface GoogleAdsAnalysisResult {
  changeHistory: ChangeEvent[];
  auctionInsights: AuctionInsightsMetrics[];
  auctionInsightsReport: any[];
  campaignMetrics: CampaignMetrics[];
  campaignMetricsBaseline: CampaignMetrics[];
  keywordMetrics: KeywordMetrics[];
  keywordMetricsBaseline: KeywordMetrics[];
  searchTerms: SearchTermMetrics[];
  searchTermsBaseline: SearchTermMetrics[];
  adMetrics: AdMetrics[];
  adMetricsBaseline: AdMetrics[];
  geoMetrics: GeoMetrics[];
  geoMetricsBaseline: GeoMetrics[];
  timeMetrics: TimeMetrics[];
  timeMetricsBaseline: TimeMetrics[];
  demographics: DemographicMetrics[];
  demographicsBaseline: DemographicMetrics[];
  anomalies: Anomaly[];
  significantChanges: SignificantChange[];
  targetDate: string;
  lookbackDays: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetDate, lookbackDays = 7 } = body;

    if (!targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN ||
        !process.env.GOOGLE_ADS_CLIENT_ID ||
        !process.env.GOOGLE_ADS_CLIENT_SECRET ||
        !process.env.GOOGLE_ADS_REFRESH_TOKEN ||
        !process.env.GOOGLE_ADS_CUSTOMER_ID) {
      return NextResponse.json(
        {
          error: 'Google Ads API credentials not configured',
          message: 'Please set the required environment variables: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID',
        },
        { status: 500 }
      );
    }

    // Calculate date range
    const targetDateObj = new Date(targetDate);
    const startDateObj = new Date(targetDateObj);
    startDateObj.setDate(startDateObj.getDate() - lookbackDays);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format for Google Ads API
    };

    const startDate = formatDate(startDateObj);
    const endDate = formatDate(targetDateObj);

    // Calculate baseline period (double the lookback for comparison)
    const baselineStartObj = new Date(startDateObj);
    baselineStartObj.setDate(baselineStartObj.getDate() - lookbackDays);
    const baselineEndObj = new Date(startDateObj);
    baselineEndObj.setDate(baselineEndObj.getDate() - 1); // Day before current period

    const baselineStartDate = formatDate(baselineStartObj);
    const baselineEndDate = formatDate(baselineEndObj);

    console.log('🔵 Google Ads API Request:');
    console.log(`  Target Date: ${targetDate}`);
    console.log(`  Lookback Days: ${lookbackDays}`);
    console.log(`  Current Period: ${startDate} to ${endDate}`);
    console.log(`  Baseline Period: ${baselineStartDate} to ${baselineEndDate}`);
    console.log(`  Customer ID: ${process.env.GOOGLE_ADS_CUSTOMER_ID}`);

    // Fetch all data in parallel - both current and baseline periods
    const [
      changeHistory,
      auctionInsights,
      auctionInsightsReport,
      campaignMetrics,
      campaignMetricsBaseline,
      keywordMetrics,
      keywordMetricsBaseline,
      searchTerms,
      searchTermsBaseline,
      adMetrics,
      adMetricsBaseline,
      geoMetrics,
      geoMetricsBaseline,
      timeMetrics,
      timeMetricsBaseline,
      demographics,
      demographicsBaseline,
      anomalies,
      significantChanges
    ] = await Promise.allSettled([
      fetchChangeHistory(startDate, endDate),
      fetchAuctionInsights(startDate, endDate),
      fetchAuctionInsightsReport(startDate, endDate),
      fetchCampaignMetrics(startDate, endDate),
      fetchCampaignMetrics(baselineStartDate, baselineEndDate),
      fetchKeywordMetrics(startDate, endDate),
      fetchKeywordMetrics(baselineStartDate, baselineEndDate),
      fetchSearchTerms(startDate, endDate),
      fetchSearchTerms(baselineStartDate, baselineEndDate),
      fetchAdMetrics(startDate, endDate),
      fetchAdMetrics(baselineStartDate, baselineEndDate),
      fetchGeoMetrics(startDate, endDate),
      fetchGeoMetrics(baselineStartDate, baselineEndDate),
      fetchTimeMetrics(startDate, endDate),
      fetchTimeMetrics(baselineStartDate, baselineEndDate),
      fetchDemographics(startDate, endDate),
      fetchDemographics(baselineStartDate, baselineEndDate),
      detectAnomalies(startDate, endDate, baselineStartDate, baselineEndDate),
      detectSignificantChanges(startDate, endDate),
    ]);

    console.log('🔵 Google Ads API Results:');
    console.log(`  Change History: ${changeHistory.status === 'fulfilled' ? changeHistory.value.length + ' events' : 'FAILED - ' + changeHistory.reason}`);
    console.log(`  Auction Insights: ${auctionInsights.status === 'fulfilled' ? auctionInsights.value.length + ' rows' : 'FAILED - ' + auctionInsights.reason}`);
    console.log(`  Auction Insights Report: ${auctionInsightsReport.status === 'fulfilled' ? auctionInsightsReport.value.length + ' rows' : 'FAILED - ' + auctionInsightsReport.reason}`);
    console.log(`  Campaign Metrics (Current): ${campaignMetrics.status === 'fulfilled' ? campaignMetrics.value.length + ' rows' : 'FAILED - ' + campaignMetrics.reason}`);
    console.log(`  Campaign Metrics (Baseline): ${campaignMetricsBaseline.status === 'fulfilled' ? campaignMetricsBaseline.value.length + ' rows' : 'FAILED - ' + campaignMetricsBaseline.reason}`);
    console.log(`  Keyword Metrics (Current): ${keywordMetrics.status === 'fulfilled' ? keywordMetrics.value.length + ' keywords' : 'FAILED - ' + keywordMetrics.reason}`);
    console.log(`  Keyword Metrics (Baseline): ${keywordMetricsBaseline.status === 'fulfilled' ? keywordMetricsBaseline.value.length + ' keywords' : 'FAILED - ' + keywordMetricsBaseline.reason}`);
    console.log(`  Search Terms (Current): ${searchTerms.status === 'fulfilled' ? searchTerms.value.length + ' terms' : 'FAILED - ' + searchTerms.reason}`);
    console.log(`  Search Terms (Baseline): ${searchTermsBaseline.status === 'fulfilled' ? searchTermsBaseline.value.length + ' terms' : 'FAILED - ' + searchTermsBaseline.reason}`);
    console.log(`  Ad Metrics (Current): ${adMetrics.status === 'fulfilled' ? adMetrics.value.length + ' ads' : 'FAILED - ' + adMetrics.reason}`);
    console.log(`  Ad Metrics (Baseline): ${adMetricsBaseline.status === 'fulfilled' ? adMetricsBaseline.value.length + ' ads' : 'FAILED - ' + adMetricsBaseline.reason}`);
    console.log(`  Geographic Metrics (Current): ${geoMetrics.status === 'fulfilled' ? geoMetrics.value.length + ' locations' : 'FAILED - ' + geoMetrics.reason}`);
    console.log(`  Geographic Metrics (Baseline): ${geoMetricsBaseline.status === 'fulfilled' ? geoMetricsBaseline.value.length + ' locations' : 'FAILED - ' + geoMetricsBaseline.reason}`);
    console.log(`  Time Metrics (Current): ${timeMetrics.status === 'fulfilled' ? timeMetrics.value.length + ' time periods' : 'FAILED - ' + timeMetrics.reason}`);
    console.log(`  Time Metrics (Baseline): ${timeMetricsBaseline.status === 'fulfilled' ? timeMetricsBaseline.value.length + ' time periods' : 'FAILED - ' + timeMetricsBaseline.reason}`);
    console.log(`  Demographics (Current): ${demographics.status === 'fulfilled' ? demographics.value.length + ' segments' : 'FAILED - ' + demographics.reason}`);
    console.log(`  Demographics (Baseline): ${demographicsBaseline.status === 'fulfilled' ? demographicsBaseline.value.length + ' segments' : 'FAILED - ' + demographicsBaseline.reason}`);
    console.log(`  Anomalies: ${anomalies.status === 'fulfilled' ? anomalies.value.length + ' detected' : 'FAILED - ' + anomalies.reason}`);
    console.log(`  Significant Changes: ${significantChanges.status === 'fulfilled' ? significantChanges.value.length + ' detected' : 'FAILED - ' + significantChanges.reason}`);

    const result: GoogleAdsAnalysisResult = {
      changeHistory: changeHistory.status === 'fulfilled' ? changeHistory.value : [],
      auctionInsights: auctionInsights.status === 'fulfilled' ? auctionInsights.value : [],
      auctionInsightsReport: auctionInsightsReport.status === 'fulfilled' ? auctionInsightsReport.value : [],
      campaignMetrics: campaignMetrics.status === 'fulfilled' ? campaignMetrics.value : [],
      campaignMetricsBaseline: campaignMetricsBaseline.status === 'fulfilled' ? campaignMetricsBaseline.value : [],
      keywordMetrics: keywordMetrics.status === 'fulfilled' ? keywordMetrics.value : [],
      keywordMetricsBaseline: keywordMetricsBaseline.status === 'fulfilled' ? keywordMetricsBaseline.value : [],
      searchTerms: searchTerms.status === 'fulfilled' ? searchTerms.value : [],
      searchTermsBaseline: searchTermsBaseline.status === 'fulfilled' ? searchTermsBaseline.value : [],
      adMetrics: adMetrics.status === 'fulfilled' ? adMetrics.value : [],
      adMetricsBaseline: adMetricsBaseline.status === 'fulfilled' ? adMetricsBaseline.value : [],
      geoMetrics: geoMetrics.status === 'fulfilled' ? geoMetrics.value : [],
      geoMetricsBaseline: geoMetricsBaseline.status === 'fulfilled' ? geoMetricsBaseline.value : [],
      timeMetrics: timeMetrics.status === 'fulfilled' ? timeMetrics.value : [],
      timeMetricsBaseline: timeMetricsBaseline.status === 'fulfilled' ? timeMetricsBaseline.value : [],
      demographics: demographics.status === 'fulfilled' ? demographics.value : [],
      demographicsBaseline: demographicsBaseline.status === 'fulfilled' ? demographicsBaseline.value : [],
      anomalies: anomalies.status === 'fulfilled' ? anomalies.value : [],
      significantChanges: significantChanges.status === 'fulfilled' ? significantChanges.value : [],
      targetDate,
      lookbackDays,
    };

    // Log any errors but don't fail the whole request
    if (changeHistory.status === 'rejected') {
      console.error('Change history fetch failed:', changeHistory.reason);
    }
    if (auctionInsights.status === 'rejected') {
      console.error('Auction insights fetch failed:', auctionInsights.reason);
    }
    if (auctionInsightsReport.status === 'rejected') {
      console.error('Auction insights report fetch failed:', auctionInsightsReport.reason);
    }
    if (campaignMetrics.status === 'rejected') {
      console.error('Campaign metrics (current) fetch failed:', campaignMetrics.reason);
    }
    if (campaignMetricsBaseline.status === 'rejected') {
      console.error('Campaign metrics (baseline) fetch failed:', campaignMetricsBaseline.reason);
    }
    if (keywordMetrics.status === 'rejected') {
      console.error('Keyword metrics (current) fetch failed:', keywordMetrics.reason);
    }
    if (keywordMetricsBaseline.status === 'rejected') {
      console.error('Keyword metrics (baseline) fetch failed:', keywordMetricsBaseline.reason);
    }
    if (searchTerms.status === 'rejected') {
      console.error('Search terms (current) fetch failed:', searchTerms.reason);
    }
    if (searchTermsBaseline.status === 'rejected') {
      console.error('Search terms (baseline) fetch failed:', searchTermsBaseline.reason);
    }
    if (adMetrics.status === 'rejected') {
      console.error('Ad metrics (current) fetch failed:', adMetrics.reason);
    }
    if (adMetricsBaseline.status === 'rejected') {
      console.error('Ad metrics (baseline) fetch failed:', adMetricsBaseline.reason);
    }
    if (geoMetrics.status === 'rejected') {
      console.error('Geographic metrics (current) fetch failed:', geoMetrics.reason);
    }
    if (geoMetricsBaseline.status === 'rejected') {
      console.error('Geographic metrics (baseline) fetch failed:', geoMetricsBaseline.reason);
    }
    if (timeMetrics.status === 'rejected') {
      console.error('Time metrics (current) fetch failed:', timeMetrics.reason);
    }
    if (timeMetricsBaseline.status === 'rejected') {
      console.error('Time metrics (baseline) fetch failed:', timeMetricsBaseline.reason);
    }
    if (demographics.status === 'rejected') {
      console.error('Demographics (current) fetch failed:', demographics.reason);
    }
    if (demographicsBaseline.status === 'rejected') {
      console.error('Demographics (baseline) fetch failed:', demographicsBaseline.reason);
    }
    if (anomalies.status === 'rejected') {
      console.error('Anomaly detection failed:', anomalies.reason);
    }
    if (significantChanges.status === 'rejected') {
      console.error('Significant changes detection failed:', significantChanges.reason);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Google Ads API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Google Ads data',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
