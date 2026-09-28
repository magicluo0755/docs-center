---
sidebar_position: 3
title: 單機安裝
---
# 單機安裝

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

## 驗證與卸載

- 驗證：執行 `./aas status` 與 `curl http://localhost:6888/health`
- 卸載：先執行 `./aas stop`，再刪除安裝目錄（數據目錄請按合規要求歸檔）
