# Anomaly Detection Dashboard

Automated Morning Routine Analysis for Ryze Beyond performance analysts.

## Features

- **Automated Anomaly Detection**: Detects significant changes (≥5%) in key performance metrics
- **Severity Classification**:
  - 🔴 CRITICAL (≥10% change)
  - 🟠 WARNING (5-9% change)
  - 🟢 POSITIVE (favorable change ≥5%)
- **Root Cause Analysis**: Drills down by dimensions (device, account, page, campaign quality)
- **Decision Tree Visualization**: Shows the analysis flow with actual values
- **Configurable Analysis**: Select target date, baseline period, and advertisers

## Monitored Metrics

### Cost Metrics (Lower is Better)
- **CPC** - Cost Per Click
- **CPAL** - Cost Per Approved Lead
- **CPOC** - Cost Per Click Out
- **CPL** - Cost Per Lead

### Performance Metrics (Higher is Better)
- **ROI** - Return on Investment
- **Revenue** - Total Revenue
- **SCTR** - Search Click Through Rate
- **COTAL** - Click Out to Approved Lead
- **EPOC** - Earnings Per Click Out
- **EPL** - Earnings Per Lead
- **EPAL** - Earnings Per Approved Lead
- **OCTL** - Out Click to Lead
- **EPA** - Earnings Per Action

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Access to Trino database
- `.env` file configured with Trino connection details

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables

Create a `.env` file in the project root:

```env
TRINO_HOST=your-trino-host.com
TRINO_PORT=8060
TRINO_CATALOG=hive
TRINO_SCHEMA=prod
TRINO_USER=dataproc
TRINO_SSL=false
```

## Usage

1. **Configure Analysis**:
   - Select target date (default: today)
   - Set baseline days (default: 13 days)
   - Choose vertical or enter custom advertiser IDs

2. **Run Analysis**:
   - Click "Analyze" to fetch data and detect anomalies

3. **Review Results**:
   - **Results Tab**: View all metrics with severity badges and root cause breakdowns
   - **Decision Tree Tab**: See the analysis flow and which conditions were met

## Default Verticals

- **Dating**: Advertiser IDs [76, 82, 100048, 100329, 100521, 100500]

## Decision Tree Logic

The app follows this analysis flow:

1. **ROAS Decline**: Check for decline in Return on Ad Spend
2. **CPA Analysis**: If ROAS declined, investigate Cost Per Acquisition
3. **Root Cause**:
   - CPC Increase: Check if cost per click went up
   - CVR Decrease: Check if conversion rate went down
4. **EPA Analysis**: Check Earnings Per Action changes
5. **Dimension Breakdown**: Identify which dimensions drive the change

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Trino
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
ba-automation-v2/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Main API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── ConfigurationPanel.tsx    # Configuration UI
│   ├── ResultsTable.tsx          # Results display
│   └── DecisionTreeView.tsx      # Decision tree visualization
├── lib/
│   ├── trino.ts                  # Trino connection & queries
│   └── metrics.ts                # Metrics calculation logic
├── types/
│   └── index.ts                  # TypeScript type definitions
├── .env                          # Environment variables (not in git)
└── package.json                  # Dependencies
```

## Anomaly Detection Rules

### Significance Threshold
- Changes ≥5% are considered significant
- Changes <5% are filtered out as noise

### Severity Levels
- **Critical**: |change| ≥ 10% in unfavorable direction
- **Warning**: 5% ≤ |change| < 10% in unfavorable direction
- **Positive**: |change| ≥ 5% in favorable direction
- **Normal**: |change| < 5%

### Baseline Comparison
- Default: Last 13 days (comparing today vs average of previous 13 days)
- Configurable: 1-30 days

## Notes

- Only SEARCH network data is analyzed
- Data is filtered for betterment-passed, non-deleted, non-direct traffic
- The SQL query combines fact_publishers (ad metrics) and fact_tracks (conversion data)

## Support

For issues or questions, contact the Ryze Beyond analytics team.
