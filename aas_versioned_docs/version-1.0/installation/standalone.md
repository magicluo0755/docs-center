---
sidebar_position: 3
title: 单机安装
---
# 单机安装

## 标准安装步骤

```bash
# 1. 创建运行用户（禁止以 root 运行）
useradd -r -s /sbin/nologin apusic

# 2. 解压安装包
tar -zxvf apusic-aas-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/aas

# 3. 授权与导入许可
su - apusic
cd /opt/apusic/aas/bin
./license.sh import /path/to/license.lic

# 4. 初始化并启动
./init.sh --silent --config=conf/install.yaml
./aas start
```

## 验证与卸载

- 验证：执行 `./aas status` 与 `curl http://localhost:6888/health`
- 卸载：先执行 `./aas stop`，再删除安装目录（数据目录请按合规要求归档）
