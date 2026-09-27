---
sidebar_position: 3
title: 安裝手冊
---
# 安裝手冊

## 系統要求

| 項目 | 最低要求 | 生產推薦 |
|------|---------|---------|
| 操作系統 | 麒麟 V10 / 統信 UOS / CentOS 7.6+ / RHEL 8+ | 麒麟 V10 SP3 |
| CPU | 4 核 | 16 核 |
| 內存 | 8 GB | 64 GB |
| 磁盤 | 100 GB SSD | 1 TB NVMe SSD |
| 依賴環境 | JDK 17+ | JDK 17 LTS |

## 獲取安裝包

安裝包隨產品發佈介質提供，或通過企業製品庫獲取：

```text
apusic-aas-2.0.0.tar.gz        # 標準版
apusic-aas-2.0.0-cluster.tar.gz # 集羣版
```

:::warning 重要提醒
生產環境部署前，請務必完成現有環境的配置備份，並覈對安裝包 SHA-256 校驗值，確保介質完整。
:::

## 標準安裝步驟

```bash
# 1. 創建運行用戶（禁止以 root 運行）
useradd -r -s /sbin/nologin apusic

# 2. 解壓安裝包
tar -zxvf apusic-aas-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/aas

# 3. 授權與導入許可
su - apusic
cd /opt/apusic/aas/bin
./license.sh import /path/to/license.lic

# 4. 初始化並啓動
./init.sh --silent --config=conf/install.yaml
./aas start
```

## 集羣部署

多節點集羣部署時，首個節點作爲引導節點，其餘節點通過加入引導節點完成組網：

```bash
./join-cluster.sh --seed 192.168.1.10:6888 --node-ip 192.168.1.11
```

建議集羣規模不少於 3 節點，並跨機架/跨機房分佈。

## 驗證與卸載

- 驗證：執行 `./aas status` 與 `curl http://localhost:6888/health`
- 卸載：先執行 `./aas stop`，再刪除安裝目錄（數據目錄請按合規要求歸檔）
