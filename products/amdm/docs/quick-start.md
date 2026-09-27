---
sidebar_position: 2
title: 快速开始
---
# 快速开始

本指南帮助您在 10 分钟内完成 金蝶Apusic主数据管理（AMDM）的首次部署与体验。

## 环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Linux x86_64 / ARM64，Windows Server 2016 及以上 |
| CPU / 内存 | 4 核 / 8 GB 起 |
| 磁盘 | 系统盘 50 GB 起 |
| 服务端口 | 8080（默认，可修改） |

## 安装与启动

```bash
# 1. 下载并解压安装包
wget https://repo.example.com/apusic/amdm/V2.0/apusic-amdm-2.0.0.tar.gz
tar -zxvf apusic-amdm-2.0.0.tar.gz -C /opt/apusic/

# 2. 初始化配置（交互式向导）
cd /opt/apusic/amdm/bin
./init.sh --interactive

# 3. 启动服务
./amdm start

# 4. 查看运行状态
./amdm status
```

## 验证部署

```bash
curl http://localhost:8080/health
```

返回 HTTP 200 即表示服务启动成功，随后可访问控制台：

```text
http://localhost:8080/console
```

默认管理员账号：`admin`，初始密码在首次启动日志 `logs/init.log` 中查看。

:::tip 下一步
- 参考[安装手册](./installation.md)完成生产级部署与集群配置
- 参考[配置手册](./configuration.md)了解核心参数
:::
