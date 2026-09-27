---
sidebar_position: 2
title: 快速開始
---
# 快速開始

本指南幫助您在 10 分鐘內完成 金蝶Apusic AI 網關（AIG）的首次部署與體驗。

## 環境要求

| 項目 | 要求 |
|------|------|
| 操作系統 | Linux x86_64 / ARM64，Windows Server 2016 及以上 |
| CPU / 內存 | 4 核 / 8 GB 起 |
| 磁盤 | 系統盤 50 GB 起 |
| 服務端口 | 8443（默認，可修改） |

## 安裝與啓動

```bash
# 1. 下載並解壓安裝包
wget https://repo.example.com/apusic/aig/V2.0/apusic-aig-2.0.0.tar.gz
tar -zxvf apusic-aig-2.0.0.tar.gz -C /opt/apusic/

# 2. 初始化配置（交互式嚮導）
cd /opt/apusic/aig/bin
./init.sh --interactive

# 3. 啓動服務
./aig start

# 4. 查看運行狀態
./aig status
```

## 驗證部署

```bash
curl http://localhost:8443/health
```

返回 HTTP 200 即表示服務啓動成功，隨後可訪問控制檯：

```text
http://localhost:8443/console
```

默認管理員賬號：`admin`，初始密碼在首次啓動日誌 `logs/init.log` 中查看。

:::tip 下一步
- 參考[安裝手冊](./installation.md)完成生產級部署與集羣配置
- 參考[配置手冊](./configuration.md)瞭解核心參數
:::
