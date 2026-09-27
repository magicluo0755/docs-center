---
sidebar_position: 3
title: 安装手册
---
# 安装手册

## 系统要求

| 项目 | 最低要求 | 生产推荐 |
|------|---------|---------|
| 操作系统 | 麒麟 V10 / 统信 UOS / CentOS 7.6+ / RHEL 8+ | 麒麟 V10 SP3 |
| CPU | 4 核 | 16 核 |
| 内存 | 8 GB | 64 GB |
| 磁盘 | 100 GB SSD | 1 TB NVMe SSD |
| 依赖环境 | JDK 17+ | JDK 17 LTS |

## 获取安装包

安装包随产品发布介质提供，或通过企业制品库获取：

```text
apusic-adgp-2.0.0.tar.gz        # 标准版
apusic-adgp-2.0.0-cluster.tar.gz # 集群版
```

:::warning 重要提醒
生产环境部署前，请务必完成现有环境的配置备份，并核对安装包 SHA-256 校验值，确保介质完整。
:::

## 标准安装步骤

```bash
# 1. 创建运行用户（禁止以 root 运行）
useradd -r -s /sbin/nologin apusic

# 2. 解压安装包
tar -zxvf apusic-adgp-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/adgp

# 3. 授权与导入许可
su - apusic
cd /opt/apusic/adgp/bin
./license.sh import /path/to/license.lic

# 4. 初始化并启动
./init.sh --silent --config=conf/install.yaml
./adgp start
```

## 集群部署

多节点集群部署时，首个节点作为引导节点，其余节点通过加入引导节点完成组网：

```bash
./join-cluster.sh --seed 192.168.1.10:8080 --node-ip 192.168.1.11
```

建议集群规模不少于 3 节点，并跨机架/跨机房分布。

## 验证与卸载

- 验证：执行 `./adgp status` 与 `curl http://localhost:8080/health`
- 卸载：先执行 `./adgp stop`，再删除安装目录（数据目录请按合规要求归档）
