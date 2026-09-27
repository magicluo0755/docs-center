---
sidebar_position: 5
title: Configuration Guide
---
# Configuration Guide

## Directory Layout

```text
apusic-akm/
├── bin/              # Startup and ops scripts
├── conf/             # Configuration files
│   ├── server.yaml   # Core service config
│   ├── security.yaml # Security and auth config
│   └── logging.yaml  # Logging config
├── lib/              # Runtime libraries
├── data/             # Runtime data
└── logs/             # Log output
```

## Core Configuration

`conf/server.yaml`:

```yaml
server:
  listen: 0.0.0.0:8000
  workers: 8
  keepalive: 60s

cluster:
  mode: standalone
  seed-nodes:
    - 192.168.1.10:8000

security:
  tls:
    enabled: false
    cert: conf/cert/server.pem
  audit:
    enabled: true

logging:
  level: INFO
  rotate: 100MB
  retain: 14
```

## Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| server.listen | 0.0.0.0:8000 | Listen address and port |
| server.workers | CPU cores | Worker threads |
| cluster.mode | standalone | Deployment mode; use cluster in production |
| security.tls.enabled | false | Enable TLS transport |
| security.audit.enabled | true | Enable operation audit |
| logging.level | INFO | Log level |

:::note Applying Changes
Startup-time parameters (listen, cluster mode) require a restart; runtime parameters such as log level can be hot-reloaded from the console.
:::

:::warning Sensitive Configuration
Encrypt passwords and keys with the built-in encryption tool before writing them to configuration files.
:::
