---
sidebar_position: 4
title: Cluster Networking and Node Join
---
# Cluster Networking and Node Join

For multi-node clusters, the first node acts as the seed node; other nodes join the cluster through it:

```bash
./join-cluster.sh --seed 192.168.1.10:6888 --node-ip 192.168.1.11
```

## Networking Principles

- Deploy at least 3 nodes, spread across racks or datacenters
- Keep inter-node latency below 2ms with at least 1Gbps bandwidth
- Place the seed node on a network segment isolated from business traffic peaks

## Confirming Node Status

After joining, confirm all nodes show Online on the console "Cluster Management" page and check that data shards are evenly distributed.
