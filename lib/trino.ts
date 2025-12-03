import fetch from "node-fetch";

interface TrinoQueryResult {
  id: string;
  stats: {
    state: string;
  };
  data?: any[][];
  columns?: Array<{ name: string; type: string }>;
  nextUri?: string;
}

const TRINO_CONFIG = {
  host: process.env.TRINO_HOST || "proddwhdpcluster.ryzebeyond.com",
  port: process.env.TRINO_PORT || "8060",
  catalog: process.env.TRINO_CATALOG || "hive",
  schema: process.env.TRINO_SCHEMA || "prod",
  user: process.env.TRINO_USER || "dataproc",
  ssl: process.env.TRINO_SSL === "true",
};

const TRINO_BASE_URL = `http${TRINO_CONFIG.ssl ? "s" : ""}://${
  TRINO_CONFIG.host
}:${TRINO_CONFIG.port}`;

async function submitQuery(sql: string): Promise<string> {
  const response = await fetch(`${TRINO_BASE_URL}/v1/statement`, {
    method: "POST",
    headers: {
      "X-Trino-User": TRINO_CONFIG.user,
      "X-Trino-Catalog": TRINO_CONFIG.catalog,
      "X-Trino-Schema": TRINO_CONFIG.schema,
      "Content-Type": "text/plain",
    },
    body: sql,
  });

  if (!response.ok) {
    throw new Error(`Failed to submit query: ${response.statusText}`);
  }

  const result: TrinoQueryResult = (await response.json()) as TrinoQueryResult;
  return result.id;
}

async function pollQueryResults(
  nextUri: string
): Promise<TrinoQueryResult | null> {
  const response = await fetch(nextUri, {
    method: "GET",
    headers: {
      "X-Trino-User": TRINO_CONFIG.user,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to poll query: ${response.statusText}`);
  }

  return (await response.json()) as TrinoQueryResult;
}

export async function executeQuery<T = any>(query: string): Promise<T[]> {
  try {
    // Submit the query
    const response = await fetch(`${TRINO_BASE_URL}/v1/statement`, {
      method: "POST",
      headers: {
        "X-Trino-User": TRINO_CONFIG.user,
        "X-Trino-Catalog": TRINO_CONFIG.catalog,
        "X-Trino-Schema": TRINO_CONFIG.schema,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`Failed to submit query: ${response.statusText}`);
    }

    let result: TrinoQueryResult = (await response.json()) as TrinoQueryResult;
    const allData: any[][] = [];
    let columns: Array<{ name: string; type: string }> = [];

    // Poll for results
    while (result.nextUri || result.stats.state === "QUEUED" || result.stats.state === "RUNNING") {
      if (result.data) {
        allData.push(...result.data);
      }
      if (result.columns && !columns.length) {
        columns = result.columns;
      }

      if (result.stats.state === "FINISHED" && !result.nextUri) {
        break;
      }

      if (!result.nextUri) {
        throw new Error("Query failed: no nextUri and not finished");
      }

      // Wait a bit before polling again
      await new Promise((resolve) => setTimeout(resolve, 100));

      const nextResponse = await fetch(result.nextUri, {
        method: "GET",
        headers: {
          "X-Trino-User": TRINO_CONFIG.user,
        },
      });

      if (!nextResponse.ok) {
        throw new Error(`Failed to poll query: ${nextResponse.statusText}`);
      }

      result = (await nextResponse.json()) as TrinoQueryResult;
    }

    // Collect any remaining data
    if (result.data) {
      allData.push(...result.data);
    }
    if (result.columns && !columns.length) {
      columns = result.columns;
    }

    // Convert array data to objects
    const objects = allData.map((row) => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col.name] = row[index];
      });
      return obj as T;
    });

    return objects;
  } catch (error) {
    console.error("Trino query error:", error);
    throw error;
  }
}

export function buildDailyStatsQuery(
  advertiserIds: number[],
  startDate: string,
  endDate: string
): string {
  const advertiserList = advertiserIds.join(", ");

  return `
    WITH publisher_data AS (
        SELECT
            sd.name as s_advertiser_name,
            adv.name as advertiser_name,
            a.name as account_name,
            pu.name as publisher_name,
            p.stats_date_tz,
            CAST(year(p.stats_date_tz) AS VARCHAR) || lpad(CAST(week_of_year(p.stats_date_tz) AS VARCHAR), 2, '0') AS week,
            format_datetime(p.stats_date_tz, 'YYYYMM') AS month,
            c.campaign_quality,
            REPLACE(REGEXP_EXTRACT(p.sid, 'page=([^&]+)'), 'page=', '') AS page,
            c.segment as campaign_segment,
            c.campaign_name,
            ag.ad_group_name,
            p.device,
            p.keyword_name,
            p.match_type_four as match_type,
            SUM(p.impressions) as impressions,
            SUM(p.clicks) as clicks,
            SUM(p.cost) as cost,
            0.0 as revenue,
            0 as lead,
            0 as sale,
            0 as approved_leads,
            0 as approved_sales,
            0 as click_out,
            0 as adjustment,
            AVG(p.search_absolute_top_impression_share) as search_absolute_top_impression_share,
            0 as qualified_lead,
            AVG(p.search_impression_share) as search_impression_share,
            0 as call,
            0 as canceled_lead
        FROM hive.prod.fact_publishers p
        LEFT JOIN hive.bo.advertisers sd ON p.advertiser_id = sd.id
        LEFT JOIN hive.bo.advertisers adv ON p.advertiser_id = adv.id
        LEFT JOIN hive.bo.accounts a ON a.source_account_id = p.account_id
        LEFT JOIN hive.bo.account_campaigns c ON p.campaign_id = c.campaign_id
        LEFT JOIN hive.bo.account_campaign_adgroups ag ON p.campaign_id = ag.campaign_id AND p.ad_group_id = ag.ad_group_id
        LEFT JOIN hive.bo.publishers pu ON p.publisher_id = pu.id
        WHERE p.stats_date_tz >= DATE '${startDate}'
            AND p.stats_date_tz <= DATE '${endDate}'
            AND p.advertiser_id IN (${advertiserList})
            AND (p.impressions <> 0 OR p.clicks <> 0 OR p.cost <> 0)
            AND (a.name IS NULL OR (LOWER(a.name) NOT LIKE '%facebook%' AND LOWER(a.name) NOT LIKE '% fb%' AND LOWER(a.name) NOT LIKE 'fb %'))
            AND (pu.name IS NULL OR (LOWER(pu.name) NOT LIKE '%facebook%' AND LOWER(pu.name) NOT LIKE '% fb %' AND LOWER(pu.name) NOT LIKE '% fb %'))
            AND a.name IS NOT NULL
        GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
    ),
    tracks_data AS (
        SELECT
            sd.name as s_advertiser_name,
            sd.name as advertiser_name,
            a.name as account_name,
            CASE
                WHEN t.network = 'SEO' THEN 'SEO'
                WHEN t.network = 'Branding Package' THEN 'Branding Package'
                ELSE COALESCE(pu.name, 'Unknown')
            END AS publisher_name,
            t.stats_date_tz,
            CAST(year(t.stats_date_tz) AS VARCHAR) || lpad(CAST(week_of_year(t.stats_date_tz) AS VARCHAR), 2, '0') AS week,
            format_datetime(t.stats_date_tz, 'YYYYMM') AS month,
            cam.campaign_quality,
            REPLACE(REGEXP_EXTRACT(t.req_url, 'page=([^&]+)'), 'page=', '') AS page,
            cam.segment as campaign_segment,
            cam.campaign_name,
            ag.ad_group_name,
            t.display_device as device,
            t.keyword as keyword_name,
            t.match_type,
            0 as impressions,
            0 as clicks,
            0.0 as cost,
            SUM(t.commission_amount) as revenue,
            SUM(t.lead) as lead,
            SUM(t.sale) as sale,
            SUM(t.lead) - COALESCE(SUM(t.canceled_lead), 0) as approved_leads,
            SUM(t.sale) - COALESCE(SUM(t.cancel_sale), 0) as approved_sales,
            SUM(t.click_out) as click_out,
            SUM(t.adjustment) as adjustment,
            0.0 as search_absolute_top_impression_share,
            SUM(CASE WHEN t.event = 'QL' THEN 1 ELSE 0 END) as qualified_lead,
            0.0 as search_impression_share,
            SUM(t.call) as call,
            SUM(t.canceled_lead) as canceled_lead
        FROM hive.prod.fact_tracks t
        INNER JOIN hive.bo.advertisers sd ON t.s_advertiser_id = sd.id
        LEFT JOIN hive.bo.account_campaigns cam ON t.pub_campaign_id = cam.campaign_id
        LEFT JOIN hive.bo.account_campaign_adgroups ag ON t.pub_campaign_id = ag.campaign_id AND t.pub_ad_group_id = ag.ad_group_id
        LEFT JOIN hive.bo.accounts a ON t.pub_account_id = a.source_account_id
        LEFT JOIN hive.bo.publishers pu ON a.publisher_id = pu.id
        WHERE t.stats_date_tz >= DATE '${startDate}'
            AND t.stats_date_tz <= DATE '${endDate}'
            AND t.s_advertiser_id IN (${advertiserList})
            AND t.passed_betterment = 1
            AND COALESCE(t.is_deleted, 0) = 0
            AND t.direct_in_click = 0
            AND t.direct_out_click = 0
            AND (a.name IS NULL OR (LOWER(a.name) NOT LIKE '%facebook%' AND LOWER(a.name) NOT LIKE '% fb%' AND LOWER(a.name) NOT LIKE 'fb %'))
            AND (pu.name IS NULL OR (LOWER(pu.name) NOT LIKE '%facebook%' AND LOWER(pu.name) NOT LIKE '% fb %' AND LOWER(pu.name) NOT LIKE '% fb %'))
            AND a.name IS NOT NULL
        GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
    ),
    combined AS (
        SELECT * FROM publisher_data
        UNION ALL
        SELECT * FROM tracks_data
    )
    SELECT
        s_advertiser_name,
        advertiser_name,
        account_name,
        publisher_name,
        stats_date_tz,
        week,
        month,
        campaign_quality,
        page,
        campaign_segment,
        campaign_name,
        ad_group_name,
        device,
        keyword_name,
        match_type,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(cost) as cost,
        SUM(revenue) as revenue,
        SUM(lead) as lead,
        SUM(sale) as sale,
        SUM(approved_leads) as approved_leads,
        SUM(approved_sales) as approved_sales,
        SUM(click_out) as click_out,
        SUM(adjustment) as adjustment,
        AVG(search_absolute_top_impression_share) as search_absolute_top_impression_share,
        SUM(qualified_lead) as qualified_lead,
        AVG(search_impression_share) as search_impression_share,
        SUM(call) as call,
        SUM(canceled_lead) as canceled_lead
    FROM combined
    GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
    HAVING SUM(impressions) > 0 OR SUM(clicks) > 0 OR SUM(cost) > 0 OR SUM(revenue) > 0 OR SUM(lead) > 0 OR SUM(click_out) > 0
    ORDER BY stats_date_tz DESC, cost DESC
  `;
}
