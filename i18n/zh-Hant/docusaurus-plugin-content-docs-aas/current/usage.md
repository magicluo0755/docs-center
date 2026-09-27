---
sidebar_position: 4
title: 使用手冊
---
# 使用手冊

## 控制檯登錄

瀏覽器訪問 `http://localhost:6888/console`，使用管理員賬號登錄。

:::note 安全建議
首次登錄後請立即修改初始密碼，並在「系統設置 → 安全策略」中啓用登錄雙因素認證。
:::

## 核心功能

### 1. 資源管理

在「資源管理」頁面可以完成資源的創建、編輯、啓停與刪除。創建資源時需指定名稱、所屬分組與資源規格。

### 2. 監控告警

- **實時監控**：展示吞吐、延遲、連接數等核心指標的實時曲線
- **告警規則**：支持閾值告警與趨勢告警，可對接郵件、短信與企業 IM Webhook
- **告警歷史**：保留最近 90 天告警記錄，支持導出

### 3. 日誌與審計

「日誌中心」支持按時間、級別、關鍵字檢索運行日誌；操作審計日誌默認保留 180 天，可在安全設置中調整。

## 通過 API 使用

```bash
# 查詢資源列表
curl -H "Authorization: Bearer <token>" \
  http://localhost:6888/api/v1/resources

# 創建資源
curl -X POST http://localhost:6888/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json
```

完整接口說明見[開發手冊](./development.md)。
