---
sidebar_position: 6
title: Developer Guide
---
# Developer Guide

## Integration Options

Apusic Master Data Management (AMDM) provides three integration options:

1. **REST API**: generic HTTP/JSON for scripts and lightweight integration
2. **Java SDK**: full object-model wrapper for Java enterprise applications
3. **Webhooks**: resource change and alert event push for automation

## REST API

- Authentication: `Authorization: Bearer <token>` (create under API Keys in the console)
- Format: JSON request and response bodies
- Version prefix: `/api/v1`

```bash
# Create a resource
curl -X POST http://localhost:8080/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json

# Get resource details
curl http://localhost:8080/api/v1/resources/demo \
  -H "Authorization: Bearer <token>"
```

## Java SDK

Maven dependency:

```xml
<dependency>
  <groupId>com.apusic</groupId>
  <artifactId>apusic-amdm-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

## Python SDK Example

```python
from apusic_sdk import Client

client = Client("http://localhost:8080", api_key="your-api-key")

# Create a resource
res = client.resources.create(name="demo", replicas=2)
print(res.id)

# Scale replicas
client.resources.scale(res.id, replicas=4)

# Query resource status
status = client.resources.status(res.id)
print(status.phase)
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 40001 | Invalid parameters | Check request body |
| 40101 | Authentication failed or token expired | Obtain a new API key |
| 40301 | Insufficient permissions | Contact the administrator |
| 50001 | Internal server error | Collect logs and contact support |

:::tip
Enable DEBUG logging in development and use the SDK built-in retry mechanism; configure idempotency and timeouts in production.
:::
