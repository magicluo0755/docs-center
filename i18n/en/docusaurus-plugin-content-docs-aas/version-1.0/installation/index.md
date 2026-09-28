---
sidebar_position: 1
title: Installation Guide
---
# Installation Guide

This guide covers the full production deployment workflow of Apusic Application Server (AAS). Choose a deployment topology before you start.

## Choose a Deployment Topology

| Topology | Use Case | Reference |
|----------|----------|-----------|
| Standalone | Development, testing, small-scale systems | [Standalone Installation](./standalone.md) |
| Cluster | Production with HA and DR requirements | [Cluster Installation](./cluster/nodes.md) |

## Reading Path

1. Review [System Requirements and Prerequisites](./prereq.md) and prepare the environment
2. Install following the chosen topology
3. After installation, initialize the console with the [User Guide](../usage.md)

:::warning Important
Back up your environment before production installation and verify the SHA-256 checksum of the package.
:::
