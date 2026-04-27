---
name: build-dashboard
description: Build a self-contained, interactive HTML dashboard with KPI cards, charts, and filterable data tables — no server required. Use when you need to visualize program metrics, create a shareable data report, build an at-a-glance status view, or turn a dataset into an interactive browser-based dashboard.
argument-hint: "<dashboard topic or dataset description>"
---

# /build-dashboard

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Generate a fully self-contained, interactive HTML dashboard. No server, no external dependencies beyond a CDN — the file opens in any browser and can be shared as a single attachment.

## Usage

```
/build-dashboard $ARGUMENTS
```

## Workflow

### 1. Define the Dashboard

Ask the user for:
- **Topic or dataset** — what data is being visualized?
- **Key questions** — what should the dashboard answer at a glance?
- **Audience** — who will read this? (leadership, program staff, funders)
- **Data source** — paste data, upload CSV/Excel, or connected warehouse
- **Filters needed** — time range, category, region, program, etc.

### 2. Plan the Layout

Design a standard dashboard layout:
1. **Header** — title, subtitle, date range selector or filter controls
2. **KPI cards** — 3-5 headline metrics (the numbers that matter most)
3. **Charts** — 1-3 visualizations showing trends, comparisons, or composition
4. **Data table** (optional) — sortable detail rows for drill-down

### 3. Handle Data by Size

| Dataset Size | Approach |
|-------------|----------|
| < 1,000 rows | Embed raw data directly in HTML |
| 1,000 – 10,000 rows | Pre-aggregate before embedding |
| > 10,000 rows | Require server-side aggregation; generate the template and query |

### 4. Generate the Dashboard

Produce a single `.html` file using:
- **Chart.js** (via CDN) for line, bar, and doughnut charts
- **CSS Grid / Flexbox** for responsive layout
- **Vanilla JavaScript** for interactivity (filter dropdowns, date ranges, sortable tables)
- **Inline styles** for self-containment — no external CSS files

## Output Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>[Dashboard Title]</title>
  <!-- Chart.js CDN, inline styles -->
</head>
<body>
  <!-- Header: title + filter controls -->
  <!-- KPI cards row: 3-5 headline metrics -->
  <!-- Charts row: trend line + bar breakdown + optional doughnut -->
  <!-- Data table: sortable columns, paginated if large -->
  <!-- Inline JavaScript: data array, chart initialization, filter logic -->
</body>
</html>
```

## Chart Type Selection

| Use Case | Chart Type |
|----------|-----------|
| Trend over time | Line chart |
| Comparing categories | Bar chart (grouped or stacked) |
| Part-to-whole composition | Doughnut chart |
| Single metric vs target | KPI card with progress bar |
| Distribution | Histogram (bar chart with equal-width bins) |

## Number Formatting

Format values automatically based on type:
- **Currency:** `$1,234` / `$1.2M` for large values
- **Percentages:** `47.3%` (one decimal)
- **Large counts:** `1,234` with commas; `12.3K` / `1.2M` for very large
- **Dates:** `Jan 2026` for month labels; `Q1 2026` for quarters

## If Connectors Available

If a **data warehouse** (Snowflake, BigQuery, Databricks) is connected:
- Query the relevant tables directly
- Auto-populate the dashboard with live data
- Include the SQL queries used in an HTML comment for reproducibility

If **file storage** (Drive, Box) is connected:
- Save the generated `.html` file to an appropriate folder
- Share a link to the saved file

## Tips

1. **Lead with KPIs** — The first thing the audience sees should answer "how are we doing?" in 5 seconds.
2. **One insight per chart** — If a chart needs a paragraph to explain, simplify it.
3. **Filters change everything** — Adding a single time-range filter dramatically increases a dashboard's usefulness.
4. **Self-contained means shareable** — No login, no server, no broken links. The HTML file is the artifact.
