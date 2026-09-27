---
sidebar_position: 6
title: 开发手册
---
# 开发手册

## 接入方式概览

金蝶Apusic数据治理平台（ADGP）提供三类开发接入方式：

1. **REST API**：通用 HTTP/JSON 接口，适合脚本与轻量集成
2. **Java SDK**：完整对象模型封装，适合 Java 企业应用
3. **Webhook 事件**：资源变更与告警事件推送，适合联动自动化

## REST API

基础约定：

- 认证方式：`Authorization: Bearer <token>`（在控制台「API 密钥」中创建）
- 数据格式：请求与响应均为 JSON
- 版本前缀：`/api/v1`

```bash
# 创建资源
curl -X POST http://localhost:8080/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json

# 查询资源详情
curl http://localhost:8080/api/v1/resources/demo \
  -H "Authorization: Bearer <token>"
```

## Java SDK

Maven 依赖：

```xml
<dependency>
  <groupId>com.apusic</groupId>
  <artifactId>apusic-adgp-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

## Python SDK 示例

```python
from apusic_sdk import Client

client = Client("http://localhost:8080", api_key="your-api-key")

# 创建资源
res = client.resources.create(name="demo", replicas=2)
print(res.id)

# 调整副本数
client.resources.scale(res.id, replicas=4)

# 查询资源状态
status = client.resources.status(res.id)
print(status.phase)
```

## 错误码约定

| 错误码 | 含义 | 处理建议 |
|--------|------|---------|
| 40001 | 参数校验失败 | 检查请求体字段 |
| 40101 | 认证失败或令牌过期 | 重新获取 API 密钥 |
| 40301 | 权限不足 | 联系管理员分配角色 |
| 50001 | 服务内部错误 | 收集日志联系技术支持 |

:::tip 开发建议
开发环境建议开启 `logging.level: DEBUG` 并使用 SDK 内置重试机制；生产环境请配置幂等与超时兜底。
:::
