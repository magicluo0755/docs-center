---
sidebar_position: 4
title: 使用手册
---
# 使用手册

## 控制台登录

浏览器访问 `http://localhost:8000/console`，使用管理员账号登录。

:::note 安全建议
首次登录后请立即修改初始密码，并在「系统设置 → 安全策略」中启用登录双因素认证。
:::

## 核心功能

### 1. 资源管理

在「资源管理」页面可以完成资源的创建、编辑、启停与删除。创建资源时需指定名称、所属分组与资源规格。

### 2. 监控告警

- **实时监控**：展示吞吐、延迟、连接数等核心指标的实时曲线
- **告警规则**：支持阈值告警与趋势告警，可对接邮件、短信与企业 IM Webhook
- **告警历史**：保留最近 90 天告警记录，支持导出

### 3. 日志与审计

「日志中心」支持按时间、级别、关键字检索运行日志；操作审计日志默认保留 180 天，可在安全设置中调整。

## 通过 API 使用

```bash
# 查询资源列表
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/resources

# 创建资源
curl -X POST http://localhost:8000/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d @resource.json
```

完整接口说明见[开发手册](./development.md)。
