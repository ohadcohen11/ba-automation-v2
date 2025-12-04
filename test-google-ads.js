#!/usr/bin/env node

/**
 * Test script to directly query Google Ads API
 * Run with: node test-google-ads.js
 */

require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');

async function testGoogleAds() {
  console.log('🔧 Testing Google Ads API Connection...\n');

  // Initialize client
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || process.env.GOOGLE_ADS_CUSTOMER_ID,
  });

  console.log('📋 Configuration:');
  console.log(`  Customer ID: ${process.env.GOOGLE_ADS_CUSTOMER_ID}`);
  console.log(`  Developer Token: ${process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.substring(0, 10)}...`);
  console.log('\n');

  try {
    // Test 1: Fetch campaigns
    console.log('🔍 Test 1: Fetching campaigns...');
    const campaignsQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      LIMIT 10
    `;
    const campaigns = await customer.query(campaignsQuery);
    console.log(`✅ Found ${campaigns.length} campaigns`);
    campaigns.forEach(c => {
      console.log(`   - ${c.campaign.name} (ID: ${c.campaign.id})`);
    });
    console.log('\n');

    // Test 2: Change History
    console.log('🔍 Test 2: Fetching change history (last 30 days)...');
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(today);

    console.log(`   Date range: ${startDate} to ${endDate}`);

    const changeQuery = `
      SELECT
        change_event.change_date_time,
        change_event.change_resource_type,
        change_event.user_email
      FROM change_event
      WHERE change_event.change_date_time >= '${startDate}'
        AND change_event.change_date_time <= '${endDate}'
      ORDER BY change_event.change_date_time DESC
      LIMIT 20
    `;
    const changes = await customer.query(changeQuery);
    console.log(`✅ Found ${changes.length} change events`);
    changes.slice(0, 5).forEach(c => {
      console.log(`   - ${c.change_event.change_date_time}: ${c.change_event.change_resource_type} by ${c.change_event.user_email}`);
    });
    console.log('\n');

    // Test 3: Auction Insights
    console.log('🔍 Test 3: Fetching auction insights (last 7 days)...');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate2 = formatDate(sevenDaysAgo);
    const endDate2 = formatDate(today);

    console.log(`   Date range: ${startDate2} to ${endDate2}`);

    const insightsQuery = `
      SELECT
        segments.date,
        metrics.search_impression_share,
        metrics.search_top_impression_share,
        campaign.name
      FROM campaign
      WHERE segments.date >= '${startDate2}'
        AND segments.date <= '${endDate2}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
      LIMIT 20
    `;
    const insights = await customer.query(insightsQuery);
    console.log(`✅ Found ${insights.length} insight rows`);
    insights.slice(0, 5).forEach(i => {
      const impressionShare = i.metrics.search_impression_share
        ? (i.metrics.search_impression_share * 100).toFixed(1)
        : 'N/A';
      console.log(`   - ${i.segments.date}: ${i.campaign.name} - Impression Share: ${impressionShare}%`);
    });
    console.log('\n');

    console.log('✅ All tests passed! Google Ads API is working correctly.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('   Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

testGoogleAds();
