---
sidebar_position: 2
title: Quick Start
---
# Quick Start

Deploy and try Apusic Memory Platform (AMEM) in 10 minutes.

## Requirements

| Item | Requirement |
|------|-------------|
| OS | Linux x86_64 / ARM64, Windows Server 2016+ |
| CPU / Memory | 4 cores / 8 GB minimum |
| Disk | 50 GB system disk |
| Service port | 8001 (default, changeable) |

## Install and Start

```bash
# 1. Download and extract
wget https://repo.example.com/apusic/amem/V2.0/apusic-amem-2.0.0.tar.gz
tar -zxvf apusic-amem-2.0.0.tar.gz -C /opt/apusic/

# 2. Initialize (interactive wizard)
cd /opt/apusic/amem/bin
./init.sh --interactive

# 3. Start the service
./amem start

# 4. Check status
./amem status
```

## Verify

```bash
curl http://localhost:8001/health
```

HTTP 200 means the service is running. Open the console:

```text
http://localhost:8001/console
```

Default administrator: `admin`. The initial password is printed to `logs/init.log` on first start.

:::tip Next steps
- See the [Installation Guide](./installation.md) for production deployment
- See the [Configuration Guide](./configuration.md) for key parameters
:::
