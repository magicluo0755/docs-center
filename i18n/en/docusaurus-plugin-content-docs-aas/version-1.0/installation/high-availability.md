---
sidebar_position: 5
title: High Availability and Disaster Recovery
---
# High Availability and Disaster Recovery

## HA Architecture

- **Node-level failover**: if any node fails, workloads switch to surviving nodes automatically, RTO < 30s
- **Access-layer HA**: front the cluster with a load balancer (e.g. Apusic ALB) to eliminate single points
- **Session replication**: with session replication enabled, session state syncs across nodes

## Cross-Datacenter DR

For mission-critical workloads, deploy at least 2 nodes in each of two datacenters within the same region, with data replicated through the cross-datacenter channel, RPO < 1min.

## Backup and Recovery

| Object | Method | Frequency |
|--------|--------|-----------|
| Configuration | Console export / archive script | Daily |
| Application data | Cluster snapshots | Daily + before changes |
| License | Keep an off-site copy | On change |
