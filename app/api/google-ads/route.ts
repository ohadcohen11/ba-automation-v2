import { NextRequest, NextResponse } from 'next/server';
import {
  fetchChangeHistory,
  fetchAuctionInsights,
  fetchAuctionInsightsReport,
  fetchCampaignMetrics,
  detectAnomalies,
  detectSignificantChanges,
  ChangeEvent,
  AuctionInsightsMetrics,
  CampaignMetrics,
  Anomaly,
  SignificantChange,
} from '@/lib/google-ads';

export interface GoogleAdsAnalysisResult {
  changeHistory: ChangeEvent[];
  auctionInsights: AuctionInsightsMetrics[];
  auctionInsightsReport: any[];
  campaignMetrics: CampaignMetrics[];
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

    // Fetch all data in parallel
    const [
      changeHistory,
      auctionInsights,
      auctionInsightsReport,
      campaignMetrics,
      anomalies,
      significantChanges
    ] = await Promise.allSettled([
      fetchChangeHistory(startDate, endDate),
      fetchAuctionInsights(startDate, endDate),
      fetchAuctionInsightsReport(startDate, endDate),
      fetchCampaignMetrics(startDate, endDate),
      detectAnomalies(startDate, endDate, baselineStartDate, baselineEndDate),
      detectSignificantChanges(startDate, endDate),
    ]);

    console.log('🔵 Google Ads API Results:');
    console.log(`  Change History: ${changeHistory.status === 'fulfilled' ? changeHistory.value.length + ' events' : 'FAILED - ' + changeHistory.reason}`);
    console.log(`  Auction Insights: ${auctionInsights.status === 'fulfilled' ? auctionInsights.value.length + ' rows' : 'FAILED - ' + auctionInsights.reason}`);
    console.log(`  Auction Insights Report: ${auctionInsightsReport.status === 'fulfilled' ? auctionInsightsReport.value.length + ' rows' : 'FAILED - ' + auctionInsightsReport.reason}`);
    console.log(`  Campaign Metrics: ${campaignMetrics.status === 'fulfilled' ? campaignMetrics.value.length + ' rows' : 'FAILED - ' + campaignMetrics.reason}`);
    console.log(`  Anomalies: ${anomalies.status === 'fulfilled' ? anomalies.value.length + ' detected' : 'FAILED - ' + anomalies.reason}`);
    console.log(`  Significant Changes: ${significantChanges.status === 'fulfilled' ? significantChanges.value.length + ' detected' : 'FAILED - ' + significantChanges.reason}`);

    const result: GoogleAdsAnalysisResult = {
      changeHistory: changeHistory.status === 'fulfilled' ? changeHistory.value : [],
      auctionInsights: auctionInsights.status === 'fulfilled' ? auctionInsights.value : [],
      auctionInsightsReport: auctionInsightsReport.status === 'fulfilled' ? auctionInsightsReport.value : [],
      campaignMetrics: campaignMetrics.status === 'fulfilled' ? campaignMetrics.value : [],
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
      console.error('Campaign metrics fetch failed:', campaignMetrics.reason);
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
