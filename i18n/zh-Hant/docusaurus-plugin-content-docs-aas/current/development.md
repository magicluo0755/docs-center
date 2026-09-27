---
sidebar_position: 6
title: 開發手冊
---
# 開發手冊

## 接入方式概覽

金蝶Apusic應用服務器（AAS）提供三類開發接入方式：

1. **REST API**：通用 HTTP/JSON 接口，適合腳本與輕量集成
2. **Java SDK**：完整對象模型封裝，適合 Java 企業應用
3. **Webhook 事件**：資源變更與告警事件推送，適合聯動自動化

## REST API

基礎約定：

- 認證方式：`Authorization: Bearer <token>`（在控制檯「API 密鑰」中創建）
- 數據格式：請求與響應均爲 JSON
- 版本前綴：`/api/v1`

```bash
# 創建資源
curl -X POST http://localhost:6888/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json

# 查詢資源詳情
curl http://localhost:6888/api/v1/resources/demo \
  -H "Authorization: Bearer <token>"
```

## Java SDK

Maven 依賴：

```xml
<dependency>
  <groupId>com.apusic</groupId>
  <artifactId>apusic-aas-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

## Python SDK 示例

```python
from apusic_sdk import Client

client = Client("http://localhost:6888", api_key="your-api-key")

# 創建資源
res = client.resources.create(name="demo", replicas=2)
print(res.id)

# 調整副本數
client.resources.scale(res.id, replicas=4)

# 查詢資源狀態
status = client.resources.status(res.id)
print(status.phase)
```

## 錯誤碼約定

| 錯誤碼 | 含義 | 處理建議 |
|--------|------|---------|
| 40001 | 參數校驗失敗 | 檢查請求體字段 |
| 40101 | 認證失敗或令牌過期 | 重新獲取 API 密鑰 |
| 40301 | 權限不足 | 聯繫管理員分配角色 |
| 50001 | 服務內部錯誤 | 收集日誌聯繫技術支持 |

:::tip 開發建議
開發環境建議開啓 `logging.level: DEBUG` 並使用 SDK 內置重試機制；生產環境請配置冪等與超時兜底。
:::
