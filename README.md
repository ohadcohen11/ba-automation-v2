# BA Automation V2 - Anomaly Detection System

Automated Morning Routine Analysis for Ryze Beyond performance analysts with **statistical significance testing**.

## Features

- **Statistical Significance Testing**: Uses Z-tests (95% confidence) instead of arbitrary thresholds
- **Automated Anomaly Detection**: Detects changes and determines if they're real or random variance
- **Severity Classification**:
  - 🔴 CRITICAL (≥10% change OR statistically significant)
  - 🟠 WARNING (5-9% change)
  - 🟢 POSITIVE (favorable change ≥5%)
  - ✅ NORMAL (within statistical variance)
- **Root Cause Analysis**: Multi-dimensional breakdown (device, account, page, campaign quality, brand)
- **Decision Tree Investigation**: Automated workflow following best practices for diagnosis
- **Statistical Formulas Display**: Shows SE, Z-score, p-values, and confidence intervals
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

## 🔬 Statistical Methodology

### Z-Test for Proportions

For rate-based metrics (CVR, CTR, SCTR, etc.), the system uses statistical significance testing:

**Standard Error (SE):**
```
SE = √[(P₀ × (1 - P₀)) / n]
```

**Z-Score:**
```
Z = (P₁ - P₀) / SE
```

**Interpretation:**
- **p < 0.05**: Statistically significant (real change)
- **p ≥ 0.05**: Within normal variance (random fluctuation)

**Constants:**
- Z = 1.96 (95% confidence level)
- α = 0.05 (significance threshold)
- Minimum sample size = 30

## Usage

1. **Configure Analysis**:
   - Select target date (default: today)
   - Set baseline days (default: 13 days)
   - Choose vertical or enter custom advertiser IDs

2. **Run Analysis**:
   - Click "Analyze" to fetch data and detect anomalies
   - System performs statistical significance tests automatically

3. **Review Results**:
   - **Daily KPIs Tab**: Day-over-day comparison
   - **Raw Data Tab**: Detailed data view
   - **Anomalies Tab**: Detected anomalies with severity and breakdowns
   - **Decision Tree Tab**:
     - Investigation workflow with highlighted path
     - Statistical significance analysis with formulas
     - SE, Z-score, p-values, and confidence intervals
     - Recommendations for each branch

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

### Statistical Significance (Primary)
For rate-based metrics (CVR, CTR, SCTR, COTAL, OCTL, ROI):
- **p < 0.05**: Statistically significant change (requires investigation)
- **p ≥ 0.05**: Within normal statistical variance
- **Minimum sample size**: 30 (clicks, impressions, or click-outs)

### Percentage Thresholds (Secondary)
For all metrics:
- **Detection threshold**: ≥5% change
- **Critical**: ≥10% change in unfavorable direction OR p < 0.05
- **Warning**: 5-9% change in unfavorable direction
- **Positive**: ≥5% change in favorable direction
- **Normal**: <5% change AND p ≥ 0.05

### Baseline Comparison
- Default: Last 13 days average
- Configurable: 1-30 days
- Calculation: Current day vs average of previous N days

## 🧪 Testing

### Test Page with Mock Data

View the system with mock data (no database connection required):

```bash
# Navigate to test page
http://localhost:3000/test-stats
```

The test page includes:
- Sample metrics with statistical significance calculations
- Full decision tree with highlighted path
- Console logging showing branch evaluation logic

## 📚 Comprehensive Documentation

For detailed documentation, see **[AGENT_GUIDE.md](./AGENT_GUIDE.md)** which includes:
- Complete data source documentation (Trino tables and schemas)
- Detailed statistical methodology
- Decision tree logic and branch conditions
- Metric calculation formulas
- Dimension breakdown analysis
- Best practices and troubleshooting
- Future enhancement roadmap

## Notes

- Only SEARCH network data is analyzed
- Data is filtered for betterment-passed, non-deleted, non-direct traffic
- The SQL query combines `fact_publishers` (cost metrics) and `fact_tracks` (revenue/conversion data)
- Facebook accounts are excluded from analysis
- Statistical significance testing requires minimum sample size of 30
- P-value threshold: α = 0.05 (95% confidence level)

## Data Sources (Trino)

**Primary Tables:**
- `hive.prod.fact_publishers` - Ad performance (clicks, impressions, cost)
- `hive.prod.fact_tracks` - Conversions and revenue
- `hive.bo.advertisers` - Advertiser metadata
- `hive.bo.accounts` - Account metadata
- `hive.bo.account_campaigns` - Campaign metadata
- `hive.bo.publishers` - Publisher metadata

See [AGENT_GUIDE.md](./AGENT_GUIDE.md) for complete schema documentation.

## Support

For issues or questions:
- Review [AGENT_GUIDE.md](./AGENT_GUIDE.md) for detailed documentation
- Check browser console for detailed path evaluation logs
- Contact the Ryze Beyond analytics team

---

**Version:** 2.0 - Now with Statistical Significance Testing
**Last Updated:** December 2024
