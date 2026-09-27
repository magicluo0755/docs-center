---
sidebar_position: 3
title: Installation Guide
---
# Installation Guide

## System Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| OS | Kylin V10 / UOS / CentOS 7.6+ / RHEL 8+ | Kylin V10 SP3 |
| CPU | 4 cores | 16 cores |
| Memory | 8 GB | 64 GB |
| Disk | 100 GB SSD | 1 TB NVMe SSD |
| Runtime | JDK 17+ | JDK 17 LTS |

## Download

```text
apusic-aas-2.0.0.tar.gz         # Standard
apusic-aas-2.0.0-cluster.tar.gz  # Cluster
```

:::warning Important
Back up your environment before production installation and verify the SHA-256 checksum of the package.
:::

## Standard Installation

```bash
# 1. Create a runtime user (do not run as root)
useradd -r -s /sbin/nologin apusic

# 2. Extract
tar -zxvf apusic-aas-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/aas

# 3. Import license
su - apusic
cd /opt/apusic/aas/bin
./license.sh import /path/to/license.lic

# 4. Initialize and start
./init.sh --silent --config=conf/install.yaml
./aas start
```

## Cluster Deployment

The first node acts as the seed node; other nodes join it:

```bash
./join-cluster.sh --seed 192.168.1.10:6888 --node-ip 192.168.1.11
```

A minimum of 3 nodes across racks or datacenters is recommended.

## Verify and Uninstall

- Verify: `./aas status` and `curl http://localhost:6888/health`
- Uninstall: stop the service, then remove the installation directory
