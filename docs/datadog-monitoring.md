# Datadog Monitoring Setup for Bay Tremor

This guide covers the recommended Datadog monitors and setup for production monitoring of the Bay Tremor earthquake tracking app.

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Log Configuration](#log-configuration)
3. [Recommended Monitors](#recommended-monitors)
4. [Dashboards](#dashboards)
5. [Alerts & Notifications](#alerts--notifications)

---

## Environment Variables

Add these to your Netlify environment variables:

```bash
# Required for RUM (Frontend Monitoring)
NEXT_PUBLIC_DD_APPLICATION_ID=your-rum-application-id
NEXT_PUBLIC_DD_CLIENT_TOKEN=your-client-token
NEXT_PUBLIC_DD_SITE=datadoghq.com  # or datadoghq.eu for EU region

# Optional: App version for tracking deployments
NEXT_PUBLIC_VERSION=1.0.0
```

To get RUM credentials:
1. Go to Datadog → UX Monitoring → RUM Applications
2. Click "New Application"
3. Select "JavaScript" and follow the setup wizard
4. Copy the Application ID and Client Token

---

## Log Configuration

Since you're using Netlify Log Drains, logs are automatically forwarded to Datadog. The structured logger we added outputs JSON logs that Datadog will parse automatically.

### Log Attributes Available

After deploying the updated code, you'll have these searchable attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `service` | Always "baytremor" | `service:baytremor` |
| `env` | Environment | `env:production` |
| `level` | Log level | `level:error` |
| `path` | API endpoint path | `path:/api/earthquakes` |
| `statusCode` | HTTP status code | `statusCode:500` |
| `duration` | Request duration (ms) | `duration:>1000` |
| `external_service` | External API called | `external_service:usgs` |
| `earthquakeId` | Specific earthquake | `earthquakeId:nc*` |
| `region` | Bay Area region | `region:san-ramon` |
| `error.kind` | Error type | `error.kind:Error` |

### Setting Up Log Pipelines

Create a processing pipeline in Datadog (Logs → Configuration → Pipelines):

1. **Filter**: `service:baytremor`
2. **Processors**:
   - Grok Parser for JSON (usually auto-detected)
   - Status Remapper: Map `level` → Status
   - Date Remapper: Map `timestamp` → Date
   - Service Remapper: Map `service` → Service

---

## Recommended Monitors

### 1. 🚨 API Error Rate Monitor (Critical)

Alerts when your API is returning too many errors.

```yaml
Name: "[Bay Tremor] High API Error Rate"
Type: Log Alert
Query: |
  logs("service:baytremor statusCode:>=500").index("*")
    .rollup("count").last("5m") > 10

Message: |
  {{#is_alert}}
  🚨 High error rate detected on Bay Tremor API
  
  More than {{threshold}} server errors in the last 5 minutes.
  
  Check the logs: https://app.datadoghq.com/logs?query=service:baytremor%20statusCode:>=500
  {{/is_alert}}
  
  {{#is_recovery}}
  ✅ Error rate has returned to normal levels.
  {{/is_recovery}}

Thresholds:
  Critical: > 10 errors in 5 minutes
  Warning: > 5 errors in 5 minutes

Tags:
  - service:baytremor
  - env:production
  - severity:critical
```

### 2. 🌐 USGS API Availability Monitor (High)

Alerts when the USGS earthquake data source is unavailable.

```yaml
Name: "[Bay Tremor] USGS API Failures"
Type: Log Alert
Query: |
  logs("service:baytremor external_service:usgs success:false").index("*")
    .rollup("count").last("15m") > 5

Message: |
  {{#is_alert}}
  ⚠️ USGS API is failing or unavailable
  
  The earthquake data source is returning errors. Users may see stale data.
  
  This could be:
  - USGS API maintenance
  - Rate limiting
  - Network issues
  
  Check USGS status: https://earthquake.usgs.gov/
  {{/is_alert}}

Thresholds:
  Critical: > 5 failures in 15 minutes
  Warning: > 2 failures in 15 minutes

Tags:
  - service:baytremor
  - external_service:usgs
  - severity:high
```

### 3. 🗄️ MongoDB Connection Monitor (High)

Alerts when the comments database is unavailable.

```yaml
Name: "[Bay Tremor] MongoDB Connection Issues"
Type: Log Alert
Query: |
  logs("service:baytremor external_service:mongodb success:false").index("*")
    .rollup("count").last("10m") > 3

Message: |
  {{#is_alert}}
  ⚠️ MongoDB connection issues detected
  
  Users may not be able to post or view comments on earthquakes.
  
  Check:
  - MongoDB Atlas status
  - Network connectivity
  - Connection string in MONGODB_URI
  {{/is_alert}}

Thresholds:
  Critical: > 3 failures in 10 minutes

Tags:
  - service:baytremor
  - external_service:mongodb
  - severity:high
```

### 4. 🤖 OpenAI API Monitor (Medium)

Alerts when AI summaries are failing.

```yaml
Name: "[Bay Tremor] OpenAI API Issues"
Type: Log Alert
Query: |
  logs("service:baytremor path:/api/ai-summary statusCode:>=500").index("*")
    .rollup("count").last("30m") > 5

Message: |
  {{#is_alert}}
  ⚠️ AI Summary generation is failing
  
  Users won't see AI-generated earthquake summaries.
  This is a degraded experience but not critical.
  
  Check:
  - OpenAI API status: https://status.openai.com/
  - API key validity
  - Rate limits
  {{/is_alert}}

Thresholds:
  Warning: > 5 failures in 30 minutes

Tags:
  - service:baytremor
  - external_service:openai
  - severity:medium
```

### 5. ⏱️ API Latency Monitor (Medium)

Alerts when API responses are slow.

```yaml
Name: "[Bay Tremor] High API Latency"
Type: Log Alert
Query: |
  logs("service:baytremor duration:>3000").index("*")
    .rollup("count").last("10m") > 20

Message: |
  {{#is_alert}}
  ⏱️ API responses are slower than normal
  
  More than {{threshold}} requests took over 3 seconds in the last 10 minutes.
  
  This could indicate:
  - Slow external API responses (USGS, MongoDB)
  - High traffic load
  - Cold starts on serverless functions
  
  Check the slow requests: https://app.datadoghq.com/logs?query=service:baytremor%20duration:>3000
  {{/is_alert}}

Thresholds:
  Warning: > 20 slow requests in 10 minutes
  Critical: > 50 slow requests in 10 minutes

Tags:
  - service:baytremor
  - severity:medium
```

### 6. 📉 No Traffic Monitor (Low)

Alerts when there's unexpectedly no traffic (possible outage indicator).

```yaml
Name: "[Bay Tremor] No API Traffic"
Type: Log Alert
Query: |
  logs("service:baytremor path:/api/*").index("*")
    .rollup("count").last("30m") < 1

Message: |
  {{#is_alert}}
  📉 No API traffic detected
  
  No API requests in the last 30 minutes. This could indicate:
  - Site is down
  - DNS issues
  - Netlify deployment problem
  
  Check: https://baytremor.com
  {{/is_alert}}

Thresholds:
  Critical: < 1 request in 30 minutes

Tags:
  - service:baytremor
  - severity:low
```

### 7. 🖥️ RUM - Frontend Errors (High)

If you enable RUM, add this monitor for JavaScript errors.

```yaml
Name: "[Bay Tremor] High Frontend Error Rate"
Type: RUM Alert
Query: |
  rum("@type:error service:baytremor").rollup("count").last("15m") > 50

Message: |
  {{#is_alert}}
  🖥️ High frontend error rate detected
  
  Users are experiencing JavaScript errors.
  
  Check RUM Error Tracking for details.
  {{/is_alert}}

Thresholds:
  Warning: > 50 errors in 15 minutes
  Critical: > 200 errors in 15 minutes

Tags:
  - service:baytremor
  - severity:high
```

### 8. 📱 RUM - Core Web Vitals (Medium)

Monitor page performance.

```yaml
Name: "[Bay Tremor] Poor Core Web Vitals"
Type: RUM Alert
Query: |
  rum("@type:view service:baytremor @view.largest_contentful_paint:>2500")
    .rollup("count").last("1h") > 100

Message: |
  {{#is_alert}}
  📱 Page load performance is degraded
  
  Many users are experiencing slow page loads (LCP > 2.5s).
  
  This impacts:
  - User experience
  - SEO rankings
  
  Check RUM Performance dashboard for details.
  {{/is_alert}}

Thresholds:
  Warning: > 100 slow page views in 1 hour

Tags:
  - service:baytremor
  - severity:medium
```

---

## Dashboards

Create a dashboard with these widgets:

### Overview Dashboard Widgets

1. **Request Volume** (Timeseries)
   ```
   logs("service:baytremor path:/api/*").rollup("count").by("path")
   ```

2. **Error Rate** (Timeseries)
   ```
   (logs("service:baytremor statusCode:>=500").rollup("count") / 
    logs("service:baytremor").rollup("count")) * 100
   ```

3. **P95 Latency** (Timeseries)
   ```
   logs("service:baytremor").rollup("p95", "@duration").by("path")
   ```

4. **External Service Health** (Heatmap)
   ```
   logs("service:baytremor external_service:*").rollup("count").by("external_service,success")
   ```

5. **Earthquakes Served** (Query Value)
   ```
   sum:logs("service:baytremor path:/api/earthquakes*")
     .rollup("sum", "@earthquakeCount").last("24h")
   ```

6. **Top Errors** (Top List)
   ```
   logs("service:baytremor level:error").rollup("count").by("@error.message")
   ```

---

## Alerts & Notifications

### Notification Channels

1. **Slack Integration** (Recommended)
   - Create a `#baytremor-alerts` channel
   - Add Datadog Slack integration
   - Route Critical → immediate, Warning → batched

2. **Email**
   - Add team email for critical alerts
   - Consider PagerDuty for on-call rotation if needed

### Alert Priority Guide

| Severity | Response Time | Example |
|----------|---------------|---------|
| Critical | < 15 min | API down, USGS unavailable |
| High | < 1 hour | MongoDB issues, high error rate |
| Medium | < 4 hours | Slow responses, AI failures |
| Low | Next business day | No traffic alerts |

---

## Quick Setup Checklist

- [ ] Add RUM environment variables to Netlify
- [ ] Deploy the updated code with structured logging
- [ ] Verify logs appear in Datadog (Logs → Search)
- [ ] Create log processing pipeline
- [ ] Set up each monitor from this guide
- [ ] Create the overview dashboard
- [ ] Configure Slack notifications
- [ ] Test alerts by triggering an error

---

## Useful Log Queries

```bash
# All errors
service:baytremor level:error

# USGS API failures
service:baytremor external_service:usgs success:false

# Slow requests (> 2s)
service:baytremor duration:>2000

# Specific endpoint errors
service:baytremor path:/api/earthquakes statusCode:>=400

# Comments activity
service:baytremor path:/api/comments

# Requests by region
service:baytremor region:san-ramon

# Recent deployments (if you add version tracking)
service:baytremor version:*
```

---

## Support

For issues with this monitoring setup:
- Datadog Documentation: https://docs.datadoghq.com/
- Netlify Log Drains: https://docs.netlify.com/monitor-sites/log-drains/

