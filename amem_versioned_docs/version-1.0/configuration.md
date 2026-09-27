---
sidebar_position: 5
title: 配置手册
---
# 配置手册

## 配置目录结构

```text
apusic-amem/
├── bin/              # 启动与运维脚本
├── conf/             # 配置文件目录
│   ├── server.yaml   # 核心服务配置
│   ├── security.yaml # 安全与认证配置
│   └── logging.yaml  # 日志配置
├── lib/              # 运行库文件
├── data/             # 运行数据目录
└── logs/             # 日志输出目录
```

## 核心配置示例

`conf/server.yaml` 主要配置项：

```yaml
server:
  listen: 0.0.0.0:8001
  workers: 8              # 工作线程数，建议为 CPU 核数
  keepalive: 60s

cluster:
  mode: standalone        # standalone / cluster
  seed-nodes:
    - 192.168.1.10:8001

security:
  tls:
    enabled: false
    cert: conf/cert/server.pem
  audit:
    enabled: true

logging:
  level: INFO             # TRACE / DEBUG / INFO / WARN / ERROR
  rotate: 100MB
  retain: 14
```

## 核心参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| server.listen | 0.0.0.0:8001 | 服务监听地址与端口 |
| server.workers | CPU 核数 | 工作线程数 |
| cluster.mode | standalone | 部署模式，生产环境建议 cluster |
| security.tls.enabled | false | 是否启用 TLS 加密传输 |
| security.audit.enabled | true | 是否启用操作审计 |
| logging.level | INFO | 日志级别 |

:::note 配置生效方式
`server.listen`、`cluster.mode` 等启动期参数修改后需重启服务生效；`logging.level` 等运行期参数可通过控制台热更新，无需重启。
:::

:::warning 敏感配置
涉及密码、密钥的配置项请使用内置加密工具加密后写入配置文件，禁止明文存储。
:::
