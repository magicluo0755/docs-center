---
sidebar_position: 7
title: Performance Tuning
---
# Performance Tuning

## Principles

1. **Measure first**: locate bottlenecks from monitoring data before tuning
2. **One change at a time**: adjust one parameter per load test round
3. **Watch the tail**: P99 latency reflects real user experience better than averages

## JVM Memory Tuning

```bash
# Example for a 64 GB host
export JAVA_OPTS="-Xms32g -Xmx32g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

- Set heap to about 50% of physical memory
- Prefer G1 or ZGC with pauses under 200 ms

## Key Parameters

| Parameter | Default | Recommendation |
|-----------|---------|----------------|
| server.workers | CPU cores | Keep for CPU-bound; 2x cores for IO-bound |
| Connection pool | 200 | Tune by load test, avoid oversizing |
| Batch size | 100 | Increase for throughput, decrease for latency |
| Flush policy | async | Use sync for strong consistency |

## Reference Benchmarks

Reference hardware: 16 cores / 64 GB / NVMe SSD.

| Metric | V2.0 | V1.0 |
|--------|------|------|
| Single-node throughput | 150K TPS | 90K TPS |
| P99 latency | 8 ms | 15 ms |
| Cluster failover time | under 30 s | under 60 s |

:::warning
Benchmarks are workload-dependent. Always validate with your own load tests.
:::

## Monitoring

- Export metrics to your unified monitoring platform (Prometheus)
- Review slow logs and GC logs periodically
- Run full regression load tests before major upgrades
