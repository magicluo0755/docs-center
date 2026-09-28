---
sidebar_position: 5
title: 配置手冊
---
# 配置手冊

## 配置目錄結構

```text
apusic-amem/
├── bin/              # 啓動與運維腳本
├── conf/             # 配置文件目錄
│   ├── server.yaml   # 核心服務配置
│   ├── security.yaml # 安全與認證配置
│   └── logging.yaml  # 日誌配置
├── lib/              # 運行庫文件
├── data/             # 運行數據目錄
└── logs/             # 日誌輸出目錄
```

## 核心配置示例

`conf/server.yaml` 主要配置項：

```yaml
server:
  listen: 0.0.0.0:8001
  workers: 8              # 工作線程數，建議爲 CPU 核數
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

## 核心參數說明

| 參數 | 默認值 | 說明 |
|------|--------|------|
| server.listen | 0.0.0.0:8001 | 服務監聽地址與端口 |
| server.workers | CPU 核數 | 工作線程數 |
| cluster.mode | standalone | 部署模式，生產環境建議 cluster |
| security.tls.enabled | false | 是否啓用 TLS 加密傳輸 |
| security.audit.enabled | true | 是否啓用操作審計 |
| logging.level | INFO | 日誌級別 |

:::note 配置生效方式
`server.listen`、`cluster.mode` 等啓動期參數修改後需重啓服務生效；`logging.level` 等運行期參數可通過控制檯熱更新，無需重啓。
:::

:::warning 敏感配置
涉及密碼、密鑰的配置項請使用內置加密工具加密後寫入配置文件，禁止明文存儲。
:::
