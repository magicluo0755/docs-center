---
sidebar_position: 4
title: User Guide
---
# User Guide

## Console

Open `http://localhost:7080/console` and sign in with the administrator account.

:::note Security Tip
Change the initial password immediately and enable two-factor authentication under System Settings.
:::

## Core Features

### 1. Resource Management

Create, edit, start, stop and delete resources on the Resources page.

### 2. Monitoring and Alerting

- **Real-time monitoring**: throughput, latency and connection metrics
- **Alert rules**: threshold and trend alerts with email, SMS and IM webhook channels
- **Alert history**: retained for 90 days, exportable

### 3. Logs and Audit

Search runtime logs by time, level and keyword. Audit logs are retained for 180 days by default.

## Using the API

```bash
# List resources
curl -H "Authorization: Bearer <token>" \
  http://localhost:7080/api/v1/resources

# Create a resource
curl -X POST http://localhost:7080/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json
```

See the [Developer Guide](./development.md) for the full API reference.
