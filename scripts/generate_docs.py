#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apusic 文档中心 Demo 内容生成器
Docusaurus 3.x 多实例版本化约定（非默认实例的版本文件位于站点根目录并带插件 ID 前缀）：
  - products/<id>/docs/*.md                              当前版本（V2.0，简体中文）
  - <id>_versioned_docs/version-1.0/*.md                 冻结版本 V1.0
  - <id>_versions.json                                   冻结版本列表
  - <id>_versioned_sidebars/version-1.0-sidebars.json    冻结版本侧边栏
  - i18n/en/docusaurus-plugin-content-docs-<id>/current/*.md       英文翻译
  - i18n/en/docusaurus-plugin-content-docs-<id>/version-1.0/*.md   英文翻译（V1.0）
  - products/<id>/sidebars.ts
  - i18n/en/docusaurus-theme-classic/navbar.json
"""
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LINES = {
    "middleware": {"zh": "中间件", "en": "Middleware"},
    "data": {"zh": "数据治理", "en": "Data Governance"},
    "ai": {"zh": "AI 平台", "en": "AI Platform"},
}

PRODUCTS = [
    {
        "id": "aas", "abbr": "AAS", "line": "middleware",
        "full_zh": "金蝶Apusic应用服务器", "full_en": "Apusic Application Server",
        "zh": "应用服务器", "en": "Application Server",
        "tagline_zh": "面向云原生与企业关键业务的新一代应用服务器中间件",
        "tagline_en": "Next-generation application server middleware for cloud-native and mission-critical workloads",
        "port": "6888",
        "features_zh": ["全面兼容 Jakarta EE 10 规范", "云原生部署与多集群统一治理", "AI 原生应用运行时支撑", "国密算法与等级保护安全合规"],
        "features_en": ["Full Jakarta EE 10 compliance", "Cloud-native deployment with unified multi-cluster governance", "AI-native application runtime support", "SM-crypto and compliance-grade security"],
    },
    {
        "id": "admq", "abbr": "ADMQ", "line": "middleware",
        "full_zh": "金蝶Apusic分布式消息队列", "full_en": "Apusic Distributed Message Queue",
        "zh": "分布式消息队列", "en": "Distributed Message Queue",
        "tagline_zh": "高吞吐、低延迟、强一致的企业级分布式消息中间件",
        "tagline_en": "High-throughput, low-latency and strongly consistent enterprise message middleware",
        "port": "8161",
        "features_zh": ["百万级 TPS 消息吞吐", "兼容 AMQP / MQTT / OpenWire 多协议", "百万级消息堆积与秒级消费回溯", "跨机房异地复制与容灾"],
        "features_en": ["Million-level TPS message throughput", "Multi-protocol support: AMQP / MQTT / OpenWire", "Million-level backlog with second-level replay", "Cross-datacenter replication and disaster recovery"],
    },
    {
        "id": "adc", "abbr": "AMDC", "line": "middleware",
        "full_zh": "金蝶Apusic分布式缓存", "full_en": "Apusic Memory Data in Cache",
        "zh": "分布式缓存", "en": "Memory Data in Cache",
        "tagline_zh": "兼容 Redis 协议的弹性分布式缓存与数据加速平台",
        "tagline_en": "Elastic distributed cache and data acceleration platform with Redis protocol compatibility",
        "port": "7080",
        "features_zh": ["100% 兼容 Redis 协议与主流客户端", "秒级水平弹性扩缩容", "多级缓存与热 Key 自动优化", "数据持久化与故障自愈"],
        "features_en": ["100% Redis protocol and client compatibility", "Second-level horizontal elastic scaling", "Multi-tier caching with automatic hot-key optimization", "Data persistence and self-healing"],
    },
    {
        "id": "alb", "abbr": "ALB", "line": "middleware",
        "full_zh": "金蝶Apusic负载均衡器", "full_en": "Apusic Load Balancer",
        "zh": "负载均衡器", "en": "Load Balancer",
        "tagline_zh": "四层/七层一体化负载均衡与统一应用流量入口",
        "tagline_en": "Integrated layer-4/layer-7 load balancing and unified application traffic entry",
        "port": "9090",
        "features_zh": ["四层/七层负载均衡与智能调度算法", "主动健康检查与会话保持", "SSL 卸载与国密 HTTPS 支持", "可视化流量监控与弹性伸缩"],
        "features_en": ["Layer-4/layer-7 balancing with intelligent scheduling", "Active health checks and session persistence", "SSL offloading with SM-crypto HTTPS support", "Visual traffic monitoring and elastic scaling"],
    },
    {
        "id": "amdm", "abbr": "AMDM", "line": "data",
        "full_zh": "金蝶Apusic主数据管理", "full_en": "Apusic Master Data Management",
        "zh": "主数据管理", "en": "Master Data Management",
        "tagline_zh": "多域主数据统一建模、治理与分发的企业级平台",
        "tagline_en": "Enterprise platform for unified modeling, governance and distribution of master data",
        "port": "8080",
        "features_zh": ["多域主数据模型与编码管理", "数据质量稽核与清洗", "跨系统编码映射与数据分发", "主数据全生命周期管理"],
        "features_en": ["Multi-domain master data model and coding management", "Data quality auditing and cleansing", "Cross-system code mapping and data distribution", "Full master data lifecycle management"],
    },
    {
        "id": "adgp", "abbr": "ADGP", "line": "data",
        "full_zh": "金蝶Apusic数据治理平台", "full_en": "Apusic Data Governance Platform",
        "zh": "数据治理平台", "en": "Data Governance Platform",
        "tagline_zh": "数据资产目录、元数据、数据标准与数据质量一体化治理平台",
        "tagline_en": "Integrated governance platform for data assets, metadata, standards and quality",
        "port": "8080",
        "features_zh": ["全域数据资产目录与检索", "元数据采集与血缘分析", "数据标准与质量规则引擎", "数据安全分类分级"],
        "features_en": ["Enterprise-wide data asset catalog and search", "Metadata harvesting and lineage analysis", "Data standards and quality rule engine", "Data security classification and grading"],
    },
    {
        "id": "aig", "abbr": "AIG", "line": "ai",
        "full_zh": "金蝶Apusic AI 网关", "full_en": "Apusic AI Gateway",
        "zh": "AI 网关", "en": "AI Gateway",
        "tagline_zh": "多模型统一接入、Agent 工具调用管控与调用审计的 AI 原生网关",
        "tagline_en": "AI-native gateway for unified model access, Agent tool-call control and audit",
        "port": "8443",
        "features_zh": ["多模型（大模型/嵌入/多模态）统一接入", "Agent 工具调用：服务集成、权限管控、调用审计", "令牌配额、限流与成本核算", "内容安全与敏感信息过滤"],
        "features_en": ["Unified access for LLM / embedding / multimodal models", "Agent tool calls: service integration, permission control, audit", "Token quota, rate limiting and cost accounting", "Content safety and sensitive-data filtering"],
    },
    {
        "id": "akm", "abbr": "AKM", "line": "ai",
        "full_zh": "金蝶Apusic知识库平台", "full_en": "Apusic Knowledge Management",
        "zh": "知识库平台", "en": "Knowledge Management",
        "tagline_zh": "企业知识接入、检索增强生成（RAG）与应用集成的一体化知识平台",
        "tagline_en": "Integrated knowledge platform for enterprise content ingestion, RAG and app integration",
        "port": "8000",
        "features_zh": ["多源文档接入与智能解析切分", "向量 + 关键词混合检索增强（RAG）", "租户隔离与细粒度权限", "开放 API 与 AI 应用集成"],
        "features_en": ["Multi-source ingestion with intelligent parsing and chunking", "Hybrid vector + keyword retrieval (RAG)", "Tenant isolation and fine-grained permissions", "Open API for AI application integration"],
    },
    {
        "id": "amem", "abbr": "AMEM", "line": "ai",
        "full_zh": "金蝶Apusic记忆平台", "full_en": "Apusic Memory Platform",
        "zh": "记忆平台", "en": "Memory Platform",
        "tagline_zh": "面向 AI 应用的长期记忆存储、检索与生命周期管理平台",
        "tagline_en": "Long-term memory storage, retrieval and lifecycle management platform for AI apps",
        "port": "8001",
        "features_zh": ["分层长期记忆存储（事实/偏好/会话）", "向量 + 图谱混合记忆检索", "记忆衰减、冲突消解与自动更新", "多 Agent 共享记忆与隔离策略"],
        "features_en": ["Tiered long-term memory: facts, preferences, sessions", "Hybrid vector + graph memory retrieval", "Memory decay, conflict resolution and auto-update", "Shared and isolated memory across multiple Agents"],
    },
]

DOCS = [
    ("index", 0, "产品首页", "Product Home"),
    ("intro", 1, "产品简介", "Product Introduction"),
    ("quick-start", 2, "快速开始", "Quick Start"),
    ("installation", 3, "安装手册", "Installation Guide"),
    ("usage", 4, "使用手册", "User Guide"),
    ("configuration", 5, "配置手册", "Configuration Guide"),
    ("development", 6, "开发手册", "Developer Guide"),
    ("performance", 7, "性能调优", "Performance Tuning"),
]


def w(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.rstrip() + "\n")


def fm(pos, title):
    return "---\nsidebar_position: %d\ntitle: %s\n---\n" % (pos, title)


def inst_link(p):
    """安装手册相对链接：AAS 已目录化（installation/index.md），其余产品仍为扁平单文件"""
    return "./installation/index.md" if p["id"] == "aas" else "./installation.md"


# ══════════════════════════ 简体中文模板 ══════════════════════════

def index_zh(p):
    line = LINES[p["line"]]["zh"]
    return fm(0, "产品首页") + f"""# {p['full_zh']}（{p['abbr']}）

{p['tagline_zh']}。金蝶天燕{line}产品线核心产品。

## 文档目录

| 文档 | 说明 |
|------|------|
| [产品简介](./intro.md) | 产品定位、核心特性与应用场景 |
| [快速开始](./quick-start.md) | 10 分钟完成首次部署与体验 |
| [安装手册]({inst_link(p)}) | 生产级部署与集群安装 |
| [使用手册](./usage.md) | 控制台操作与核心功能使用 |
| [配置手册](./configuration.md) | 配置文件与核心参数说明 |
| [开发手册](./development.md) | API 与 SDK 集成开发 |
| [性能调优](./performance.md) | 性能参数调优与基准参考 |

:::info 版本切换
本产品维护 **V1.0** 与 **V2.0** 两个版本文档，请通过左侧导航栏顶部的版本切换器选择。
:::
"""


def intro_zh(p):
    line = LINES[p["line"]]["zh"]
    feats = "\n".join("%d. %s" % (i + 1, f) for i, f in enumerate(p["features_zh"]))
    return fm(1, "产品简介") + f"""# {p['full_zh']}简介

{p['tagline_zh']}。{p['full_zh']}（{p['abbr']}）是金蝶天燕{line}产品线旗下的核心产品。

:::info 版本说明
本站同时维护 **V1.0** 与 **V2.0** 两个版本文档，请通过左侧导航栏顶部的版本切换器选择对应版本阅读。
:::

## 产品定位

{p['zh']}面向企业级市场，致力于为业务系统提供稳定、高效、安全的基础能力，支持物理机、虚拟机与容器化多种部署形态，满足信创环境下全栈国产化适配要求。

## 核心特性

{feats}

## 典型应用场景

- **核心业务系统支撑**：为交易、结算等关键业务提供高可用运行底座
- **规模化集群部署**：支持跨机房多活与统一管控，满足大型企业 IT 架构要求
- **信创适配迁移**：提供从国外同类产品的平滑迁移方案与工具

## 文档导航

| 文档 | 说明 |
|------|------|
| [快速开始](./quick-start.md) | 10 分钟完成首次部署与体验 |
| [安装手册]({inst_link(p)}) | 生产级部署与集群安装 |
| [使用手册](./usage.md) | 控制台操作与核心功能使用 |
| [配置手册](./configuration.md) | 配置文件与核心参数说明 |
| [开发手册](./development.md) | API 与 SDK 集成开发 |
| [性能调优](./performance.md) | 性能参数调优与基准参考 |
"""


def quick_start_zh(p):
    return fm(2, "快速开始") + f"""# 快速开始

本指南帮助您在 10 分钟内完成 {p['full_zh']}（{p['abbr']}）的首次部署与体验。

## 环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Linux x86_64 / ARM64，Windows Server 2016 及以上 |
| CPU / 内存 | 4 核 / 8 GB 起 |
| 磁盘 | 系统盘 50 GB 起 |
| 服务端口 | {p['port']}（默认，可修改） |

## 安装与启动

```bash
# 1. 下载并解压安装包
wget https://repo.example.com/apusic/{p['id']}/V2.0/apusic-{p['id']}-2.0.0.tar.gz
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/

# 2. 初始化配置（交互式向导）
cd /opt/apusic/{p['id']}/bin
./init.sh --interactive

# 3. 启动服务
./{p['id']} start

# 4. 查看运行状态
./{p['id']} status
```

## 验证部署

```bash
curl http://localhost:{p['port']}/health
```

返回 HTTP 200 即表示服务启动成功，随后可访问控制台：

```text
http://localhost:{p['port']}/console
```

默认管理员账号：`admin`，初始密码在首次启动日志 `logs/init.log` 中查看。

:::tip 下一步
- 参考[安装手册]({inst_link(p)})完成生产级部署与集群配置
- 参考[配置手册](./configuration.md)了解核心参数
:::
"""


def installation_zh(p):
    return fm(3, "安装手册") + f"""# 安装手册

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
apusic-{p['id']}-2.0.0.tar.gz        # 标准版
apusic-{p['id']}-2.0.0-cluster.tar.gz # 集群版
```

:::warning 重要提醒
生产环境部署前，请务必完成现有环境的配置备份，并核对安装包 SHA-256 校验值，确保介质完整。
:::

## 标准安装步骤

```bash
# 1. 创建运行用户（禁止以 root 运行）
useradd -r -s /sbin/nologin apusic

# 2. 解压安装包
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/{p['id']}

# 3. 授权与导入许可
su - apusic
cd /opt/apusic/{p['id']}/bin
./license.sh import /path/to/license.lic

# 4. 初始化并启动
./init.sh --silent --config=conf/install.yaml
./{p['id']} start
```

## 集群部署

多节点集群部署时，首个节点作为引导节点，其余节点通过加入引导节点完成组网：

```bash
./join-cluster.sh --seed 192.168.1.10:{p['port']} --node-ip 192.168.1.11
```

建议集群规模不少于 3 节点，并跨机架/跨机房分布。

## 验证与卸载

- 验证：执行 `./{p['id']} status` 与 `curl http://localhost:{p['port']}/health`
- 卸载：先执行 `./{p['id']} stop`，再删除安装目录（数据目录请按合规要求归档）
"""


# ── AAS 安装指南目录树（业界组织：手册=目录，index 为 landing，子目录=编 Part）──

def installation_index_zh(p):
    return fm(1, "安装指南") + f"""# 安装指南

本指南覆盖 {p['full_zh']}（{p['abbr']}）生产级部署的全流程。开始安装前，请先根据业务场景选择部署形态。

## 部署形态选择

| 部署形态 | 适用场景 | 参考章节 |
|---------|---------|---------|
| 单机部署 | 开发测试环境、小规模业务系统 | [单机安装](./standalone.md) |
| 集群部署 | 生产环境、高可用与容灾要求 | [集群安装](./cluster/nodes.md) |

## 阅读路径

1. 确认 [系统要求与前置条件](./prereq.md)，准备运行环境
2. 按所选部署形态执行安装
3. 安装完成后，参考[使用手册](../usage.md)完成控制台初始化

:::warning 重要提醒
生产环境部署前，请务必完成现有环境的配置备份，并核对安装包 SHA-256 校验值，确保介质完整。
:::
"""


def installation_prereq_zh(p):
    return fm(2, "系统要求与前置条件") + f"""# 系统要求与前置条件

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
apusic-{p['id']}-2.0.0.tar.gz        # 标准版
apusic-{p['id']}-2.0.0-cluster.tar.gz # 集群版
```

:::warning 介质完整性
安装前请核对安装包 SHA-256 校验值；校验不一致时禁止安装，并重新获取介质。
:::
"""


def installation_standalone_zh(p):
    return fm(3, "单机安装") + f"""# 单机安装

## 标准安装步骤

```bash
# 1. 创建运行用户（禁止以 root 运行）
useradd -r -s /sbin/nologin apusic

# 2. 解压安装包
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/{p['id']}

# 3. 授权与导入许可
su - apusic
cd /opt/apusic/{p['id']}/bin
./license.sh import /path/to/license.lic

# 4. 初始化并启动
./init.sh --silent --config=conf/install.yaml
./{p['id']} start
```

## 验证与卸载

- 验证：执行 `./{p['id']} status` 与 `curl http://localhost:{p['port']}/health`
- 卸载：先执行 `./{p['id']} stop`，再删除安装目录（数据目录请按合规要求归档）
"""


def installation_nodes_zh(p):
    return fm(1, "集群组网与节点加入") + f"""# 集群组网与节点加入

多节点集群部署时，首个节点作为引导节点，其余节点通过加入引导节点完成组网：

```bash
./join-cluster.sh --seed 192.168.1.10:{p['port']} --node-ip 192.168.1.11
```

## 组网原则

- 集群规模不少于 3 节点，并跨机架/跨机房分布
- 节点间网络延迟建议低于 2ms，带宽不低于 1Gbps
- 引导节点建议部署在独立于业务高峰的网段

## 节点状态确认

加入完成后，通过控制台「集群管理」页面确认各节点状态均为 Online，并检查数据分片分布是否均匀。
"""


def installation_ha_zh(p):
    return fm(2, "高可用与容灾") + f"""# 高可用与容灾

## 高可用架构

- **节点级容错**：集群内任一节点故障，业务自动切换至存活节点，RTO < 30s
- **接入层高可用**：前端通过负载均衡器（如 Apusic ALB）对接集群，消除单点
- **会话复制**：开启会话复制后，节点间自动同步会话状态

## 跨机房容灾

生产关键业务建议采用同城双机房部署，两机房各部署不少于 2 节点，通过异地复制通道保持数据同步，RPO < 1min。

## 备份与恢复

| 对象 | 方式 | 建议频率 |
|------|------|---------|
| 配置文件 | 控制台导出 / 脚本打包 | 每日 |
| 应用数据 | 集群快照 | 每日 + 变更前 |
| 许可文件 | 异地存放一份副本 | 变更时 |
"""


def usage_zh(p):
    return fm(4, "使用手册") + f"""# 使用手册

## 控制台登录

浏览器访问 `http://localhost:{p['port']}/console`，使用管理员账号登录。

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
curl -H "Authorization: Bearer <token>" \\
  http://localhost:{p['port']}/api/v1/resources

# 创建资源
curl -X POST http://localhost:{p['port']}/api/v1/resources \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d @resource.json
```

完整接口说明见[开发手册](./development.md)。
"""


def configuration_zh(p):
    return fm(5, "配置手册") + f"""# 配置手册

## 配置目录结构

```text
apusic-{p['id']}/
├── bin/              # 启动与运维脚本
├── conf/             # 配置文件目录
│   ├── server.yaml   # 核心服务配置
│   ├── security.yaml # 安全与认证配置
│   └── logging.yaml  # 日志配置
├── lib/              # 运行库文件
├── data/             # 运行数据目录
└── logs/             # 日志输出目录
```

## 核心配置示例

`conf/server.yaml` 主要配置项：

```yaml
server:
  listen: 0.0.0.0:{p['port']}
  workers: 8              # 工作线程数，建议为 CPU 核数
  keepalive: 60s

cluster:
  mode: standalone        # standalone / cluster
  seed-nodes:
    - 192.168.1.10:{p['port']}

security:
  tls:
    enabled: false
    cert: conf/cert/server.pem
  audit:
    enabled: true

logging:
  level: INFO             # TRACE / DEBUG / INFO / WARN / ERROR
  rotate: 100MB
  retain: 14
```

## 核心参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| server.listen | 0.0.0.0:{p['port']} | 服务监听地址与端口 |
| server.workers | CPU 核数 | 工作线程数 |
| cluster.mode | standalone | 部署模式，生产环境建议 cluster |
| security.tls.enabled | false | 是否启用 TLS 加密传输 |
| security.audit.enabled | true | 是否启用操作审计 |
| logging.level | INFO | 日志级别 |

:::note 配置生效方式
`server.listen`、`cluster.mode` 等启动期参数修改后需重启服务生效；`logging.level` 等运行期参数可通过控制台热更新，无需重启。
:::

:::warning 敏感配置
涉及密码、密钥的配置项请使用内置加密工具加密后写入配置文件，禁止明文存储。
:::
"""


def development_zh(p):
    return fm(6, "开发手册") + f"""# 开发手册

## 接入方式概览

{p['full_zh']}（{p['abbr']}）提供三类开发接入方式：

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
curl -X POST http://localhost:{p['port']}/api/v1/resources \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d @resource.json

# 查询资源详情
curl http://localhost:{p['port']}/api/v1/resources/demo \\
  -H "Authorization: Bearer <token>"
```

## Java SDK

Maven 依赖：

```xml
<dependency>
  <groupId>com.apusic</groupId>
  <artifactId>apusic-{p['id']}-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

## Python SDK 示例

```python
from apusic_sdk import Client

client = Client("http://localhost:{p['port']}", api_key="your-api-key")

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
"""


def performance_zh(p):
    return fm(7, "性能调优") + f"""# 性能调优

## 调优总原则

1. **先测量，后调优**：基于监控数据定位瓶颈，避免盲目调参
2. **逐项调整**：每次只调整一项参数并做压测对比
3. **关注长尾**：P99 延迟往往比平均值更能反映真实体验

## JVM 内存调优

```bash
# JVM 堆内存调优示例（以 64 GB 内存主机为例）
export JAVA_OPTS="-Xms32g -Xmx32g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

- 堆内存建议设置为物理内存的 50% 左右
- 使用 G1 或 ZGC 收集器，控制单次停顿在 200ms 以内

## 核心调优参数

| 参数 | 默认值 | 调优建议 |
|------|--------|---------|
| server.workers | CPU 核数 | CPU 密集场景保持默认；IO 密集可上调至核数 × 2 |
| 连接池上限 | 200 | 根据压测并发量调整，避免过大导致上下文切换 |
| 批处理大小 | 100 | 吞吐优先可增大；延迟优先可减小 |
| 刷盘策略 | async | 强一致场景改为 sync，注意性能损耗 |

## 基准参考数据

以下为参考硬件（16 核 / 64 GB / NVMe SSD）上的典型基准表现：

| 指标 | V2.0 参考值 | V1.0 参考值 |
|------|------------|------------|
| 单节点吞吐 | 15 万 TPS | 9 万 TPS |
| P99 延迟 | 8 ms | 15 ms |
| 集群故障恢复时间 | 小于 30 s | 小于 60 s |

:::warning 注意
基准数据与业务模型强相关，实际表现请以自身业务压测结果为准。
:::

## 监控与持续优化

- 开启监控指标导出，接入企业统一监控平台（Prometheus）
- 定期评审慢日志与 GC 日志，建立性能基线
- 大版本升级前完成全量回归压测
"""


# ══════════════════════════ 英文模板 ══════════════════════════

def index_en(p):
    line = LINES[p["line"]]["en"]
    return fm(0, "Product Home") + f"""# {p['full_en']} ({p['abbr']})

{p['tagline_en']}. A core product of the Apusic {line} line.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Introduction](./intro.md) | Positioning, features and use cases |
| [Quick Start](./quick-start.md) | First deployment in 10 minutes |
| [Installation Guide]({inst_link(p)}) | Production and cluster deployment |
| [User Guide](./usage.md) | Console and core features |
| [Configuration Guide](./configuration.md) | Configuration files and parameters |
| [Developer Guide](./development.md) | API and SDK integration |
| [Performance Tuning](./performance.md) | Tuning and benchmarks |

:::info Versioning
Both **V1.0** and **V2.0** documentation are maintained. Use the version switcher at the top of the left sidebar.
:::
"""


def intro_en(p):
    line = LINES[p["line"]]["en"]
    feats = "\n".join("%d. %s" % (i + 1, f) for i, f in enumerate(p["features_en"]))
    return fm(1, "Product Introduction") + f"""# Introduction to {p['full_en']} ({p['abbr']})

{p['tagline_en']}. {p['full_en']} ({p['abbr']}) is a core product of the Apusic {line} product line.

:::info Versioning
Both **V1.0** and **V2.0** documentation are maintained. Use the version switcher at the top of the left sidebar.
:::

## Positioning

{p['en']} delivers stable, efficient and secure infrastructure capabilities for enterprise workloads, supporting bare-metal, virtualized and containerized deployments, and full localization compliance.

## Key Features

{feats}

## Typical Use Cases

- **Mission-critical systems**: high-availability foundation for transaction and settlement workloads
- **Large-scale clusters**: multi-datacenter HA with unified management
- **Localization migration**: smooth migration from foreign counterparts

## Documentation Map

| Document | Description |
|----------|-------------|
| [Quick Start](./quick-start.md) | First deployment in 10 minutes |
| [Installation Guide]({inst_link(p)}) | Production and cluster deployment |
| [User Guide](./usage.md) | Console and core features |
| [Configuration Guide](./configuration.md) | Configuration files and parameters |
| [Developer Guide](./development.md) | API and SDK integration |
| [Performance Tuning](./performance.md) | Tuning and benchmarks |
"""


def quick_start_en(p):
    return fm(2, "Quick Start") + f"""# Quick Start

Deploy and try {p['full_en']} ({p['abbr']}) in 10 minutes.

## Requirements

| Item | Requirement |
|------|-------------|
| OS | Linux x86_64 / ARM64, Windows Server 2016+ |
| CPU / Memory | 4 cores / 8 GB minimum |
| Disk | 50 GB system disk |
| Service port | {p['port']} (default, changeable) |

## Install and Start

```bash
# 1. Download and extract
wget https://repo.example.com/apusic/{p['id']}/V2.0/apusic-{p['id']}-2.0.0.tar.gz
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/

# 2. Initialize (interactive wizard)
cd /opt/apusic/{p['id']}/bin
./init.sh --interactive

# 3. Start the service
./{p['id']} start

# 4. Check status
./{p['id']} status
```

## Verify

```bash
curl http://localhost:{p['port']}/health
```

HTTP 200 means the service is running. Open the console:

```text
http://localhost:{p['port']}/console
```

Default administrator: `admin`. The initial password is printed to `logs/init.log` on first start.

:::tip Next steps
- See the [Installation Guide]({inst_link(p)}) for production deployment
- See the [Configuration Guide](./configuration.md) for key parameters
:::
"""


def installation_en(p):
    return fm(3, "Installation Guide") + f"""# Installation Guide

## System Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| OS | Kylin V10 / UOS / CentOS 7.6+ / RHEL 8+ | Kylin V10 SP3 |
| CPU | 4 cores | 16 cores |
| Memory | 8 GB | 64 GB |
| Disk | 100 GB SSD | 1 TB NVMe SSD |
| Runtime | JDK 17+ | JDK 17 LTS |

## Download

```text
apusic-{p['id']}-2.0.0.tar.gz         # Standard
apusic-{p['id']}-2.0.0-cluster.tar.gz  # Cluster
```

:::warning Important
Back up your environment before production installation and verify the SHA-256 checksum of the package.
:::

## Standard Installation

```bash
# 1. Create a runtime user (do not run as root)
useradd -r -s /sbin/nologin apusic

# 2. Extract
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/{p['id']}

# 3. Import license
su - apusic
cd /opt/apusic/{p['id']}/bin
./license.sh import /path/to/license.lic

# 4. Initialize and start
./init.sh --silent --config=conf/install.yaml
./{p['id']} start
```

## Cluster Deployment

The first node acts as the seed node; other nodes join it:

```bash
./join-cluster.sh --seed 192.168.1.10:{p['port']} --node-ip 192.168.1.11
```

A minimum of 3 nodes across racks or datacenters is recommended.

## Verify and Uninstall

- Verify: `./{p['id']} status` and `curl http://localhost:{p['port']}/health`
- Uninstall: stop the service, then remove the installation directory
"""


# ── AAS 安装指南目录树（英文）──

def installation_index_en(p):
    return fm(1, "Installation Guide") + f"""# Installation Guide

This guide covers the full production deployment workflow of {p['full_en']} ({p['abbr']}). Choose a deployment topology before you start.

## Choose a Deployment Topology

| Topology | Use Case | Reference |
|----------|----------|-----------|
| Standalone | Development, testing, small-scale systems | [Standalone Installation](./standalone.md) |
| Cluster | Production with HA and DR requirements | [Cluster Installation](./cluster/nodes.md) |

## Reading Path

1. Review [System Requirements and Prerequisites](./prereq.md) and prepare the environment
2. Install following the chosen topology
3. After installation, initialize the console with the [User Guide](../usage.md)

:::warning Important
Back up your environment before production installation and verify the SHA-256 checksum of the package.
:::
"""


def installation_prereq_en(p):
    return fm(2, "System Requirements and Prerequisites") + f"""# System Requirements and Prerequisites

## System Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| OS | Kylin V10 / UOS / CentOS 7.6+ / RHEL 8+ | Kylin V10 SP3 |
| CPU | 4 cores | 16 cores |
| Memory | 8 GB | 64 GB |
| Disk | 100 GB SSD | 1 TB NVMe SSD |
| Runtime | JDK 17+ | JDK 17 LTS |

## Obtaining the Package

The installation package is delivered with the release media or via the enterprise artifact repository:

```text
apusic-{p['id']}-2.0.0.tar.gz         # Standard
apusic-{p['id']}-2.0.0-cluster.tar.gz # Cluster
```

:::warning Media Integrity
Verify the SHA-256 checksum before installation. Never install from a package whose checksum does not match.
:::
"""


def installation_standalone_en(p):
    return fm(3, "Standalone Installation") + f"""# Standalone Installation

## Standard Installation Steps

```bash
# 1. Create a runtime user (do not run as root)
useradd -r -s /sbin/nologin apusic

# 2. Extract the package
tar -zxvf apusic-{p['id']}-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/{p['id']}

# 3. Grant permissions and import the license
su - apusic
cd /opt/apusic/{p['id']}/bin
./license.sh import /path/to/license.lic

# 4. Initialize and start
./init.sh --silent --config=conf/install.yaml
./{p['id']} start
```

## Verification and Uninstall

- Verify: run `./{p['id']} status` and `curl http://localhost:{p['port']}/health`
- Uninstall: run `./{p['id']} stop` first, then remove the installation directory (archive data directories per compliance requirements)
"""


def installation_nodes_en(p):
    return fm(1, "Cluster Networking and Node Join") + f"""# Cluster Networking and Node Join

For multi-node clusters, the first node acts as the seed node; other nodes join the cluster through it:

```bash
./join-cluster.sh --seed 192.168.1.10:{p['port']} --node-ip 192.168.1.11
```

## Networking Principles

- Deploy at least 3 nodes, spread across racks or datacenters
- Keep inter-node latency below 2ms with at least 1Gbps bandwidth
- Place the seed node on a network segment isolated from business traffic peaks

## Confirming Node Status

After joining, confirm all nodes show Online on the console "Cluster Management" page and check that data shards are evenly distributed.
"""


def installation_ha_en(p):
    return fm(2, "High Availability and Disaster Recovery") + f"""# High Availability and Disaster Recovery

## HA Architecture

- **Node-level failover**: if any node fails, workloads switch to surviving nodes automatically, RTO < 30s
- **Access-layer HA**: front the cluster with a load balancer (e.g. Apusic ALB) to eliminate single points
- **Session replication**: with session replication enabled, session state syncs across nodes

## Cross-Datacenter DR

For mission-critical workloads, deploy at least 2 nodes in each of two datacenters within the same region, with data replicated through the cross-datacenter channel, RPO < 1min.

## Backup and Recovery

| Object | Method | Frequency |
|--------|--------|-----------|
| Configuration | Console export / archive script | Daily |
| Application data | Cluster snapshots | Daily + before changes |
| License | Keep an off-site copy | On change |
"""


def usage_en(p):
    return fm(4, "User Guide") + f"""# User Guide

## Console

Open `http://localhost:{p['port']}/console` and sign in with the administrator account.

:::note Security Tip
Change the initial password immediately and enable two-factor authentication under System Settings.
:::

## Core Features

### 1. Resource Management

Create, edit, start, stop and delete resources on the Resources page.

### 2. Monitoring and Alerting

- **Real-time monitoring**: throughput, latency and connection metrics
- **Alert rules**: threshold and trend alerts with email, SMS and IM webhook channels
- **Alert history**: retained for 90 days, exportable

### 3. Logs and Audit

Search runtime logs by time, level and keyword. Audit logs are retained for 180 days by default.

## Using the API

```bash
# List resources
curl -H "Authorization: Bearer <token>" \\
  http://localhost:{p['port']}/api/v1/resources

# Create a resource
curl -X POST http://localhost:{p['port']}/api/v1/resources \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d @resource.json
```

See the [Developer Guide](./development.md) for the full API reference.
"""


def configuration_en(p):
    return fm(5, "Configuration Guide") + f"""# Configuration Guide

## Directory Layout

```text
apusic-{p['id']}/
├── bin/              # Startup and ops scripts
├── conf/             # Configuration files
│   ├── server.yaml   # Core service config
│   ├── security.yaml # Security and auth config
│   └── logging.yaml  # Logging config
├── lib/              # Runtime libraries
├── data/             # Runtime data
└── logs/             # Log output
```

## Core Configuration

`conf/server.yaml`:

```yaml
server:
  listen: 0.0.0.0:{p['port']}
  workers: 8
  keepalive: 60s

cluster:
  mode: standalone
  seed-nodes:
    - 192.168.1.10:{p['port']}

security:
  tls:
    enabled: false
    cert: conf/cert/server.pem
  audit:
    enabled: true

logging:
  level: INFO
  rotate: 100MB
  retain: 14
```

## Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| server.listen | 0.0.0.0:{p['port']} | Listen address and port |
| server.workers | CPU cores | Worker threads |
| cluster.mode | standalone | Deployment mode; use cluster in production |
| security.tls.enabled | false | Enable TLS transport |
| security.audit.enabled | true | Enable operation audit |
| logging.level | INFO | Log level |

:::note Applying Changes
Startup-time parameters (listen, cluster mode) require a restart; runtime parameters such as log level can be hot-reloaded from the console.
:::

:::warning Sensitive Configuration
Encrypt passwords and keys with the built-in encryption tool before writing them to configuration files.
:::
"""


def development_en(p):
    return fm(6, "Developer Guide") + f"""# Developer Guide

## Integration Options

{p['full_en']} ({p['abbr']}) provides three integration options:

1. **REST API**: generic HTTP/JSON for scripts and lightweight integration
2. **Java SDK**: full object-model wrapper for Java enterprise applications
3. **Webhooks**: resource change and alert event push for automation

## REST API

- Authentication: `Authorization: Bearer <token>` (create under API Keys in the console)
- Format: JSON request and response bodies
- Version prefix: `/api/v1`

```bash
# Create a resource
curl -X POST http://localhost:{p['port']}/api/v1/resources \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d @resource.json

# Get resource details
curl http://localhost:{p['port']}/api/v1/resources/demo \\
  -H "Authorization: Bearer <token>"
```

## Java SDK

Maven dependency:

```xml
<dependency>
  <groupId>com.apusic</groupId>
  <artifactId>apusic-{p['id']}-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

## Python SDK Example

```python
from apusic_sdk import Client

client = Client("http://localhost:{p['port']}", api_key="your-api-key")

# Create a resource
res = client.resources.create(name="demo", replicas=2)
print(res.id)

# Scale replicas
client.resources.scale(res.id, replicas=4)

# Query resource status
status = client.resources.status(res.id)
print(status.phase)
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 40001 | Invalid parameters | Check request body |
| 40101 | Authentication failed or token expired | Obtain a new API key |
| 40301 | Insufficient permissions | Contact the administrator |
| 50001 | Internal server error | Collect logs and contact support |

:::tip
Enable DEBUG logging in development and use the SDK built-in retry mechanism; configure idempotency and timeouts in production.
:::
"""


def performance_en(p):
    return fm(7, "Performance Tuning") + f"""# Performance Tuning

## Principles

1. **Measure first**: locate bottlenecks from monitoring data before tuning
2. **One change at a time**: adjust one parameter per load test round
3. **Watch the tail**: P99 latency reflects real user experience better than averages

## JVM Memory Tuning

```bash
# Example for a 64 GB host
export JAVA_OPTS="-Xms32g -Xmx32g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

- Set heap to about 50% of physical memory
- Prefer G1 or ZGC with pauses under 200 ms

## Key Parameters

| Parameter | Default | Recommendation |
|-----------|---------|----------------|
| server.workers | CPU cores | Keep for CPU-bound; 2x cores for IO-bound |
| Connection pool | 200 | Tune by load test, avoid oversizing |
| Batch size | 100 | Increase for throughput, decrease for latency |
| Flush policy | async | Use sync for strong consistency |

## Reference Benchmarks

Reference hardware: 16 cores / 64 GB / NVMe SSD.

| Metric | V2.0 | V1.0 |
|--------|------|------|
| Single-node throughput | 150K TPS | 90K TPS |
| P99 latency | 8 ms | 15 ms |
| Cluster failover time | under 30 s | under 60 s |

:::warning
Benchmarks are workload-dependent. Always validate with your own load tests.
:::

## Monitoring

- Export metrics to your unified monitoring platform (Prometheus)
- Review slow logs and GC logs periodically
- Run full regression load tests before major upgrades
"""


ZH = {"index": index_zh, "intro": intro_zh, "quick-start": quick_start_zh, "installation": installation_zh,
      "usage": usage_zh, "configuration": configuration_zh, "development": development_zh,
      "performance": performance_zh}
EN = {"index": index_en, "intro": intro_en, "quick-start": quick_start_en, "installation": installation_en,
      "usage": usage_en, "configuration": configuration_en, "development": development_en,
      "performance": performance_en}


def sidebars_ts(pid):
    return f"""import type {{SidebarsConfig}} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {{
  // 当前版本（V2.0）；V1.0 冻结版侧边栏见站点根目录 {pid}_versioned_sidebars/
  '{pid}': [{{type: 'autogenerated', dirName: '.'}}],
}};

export default sidebars;
"""


def versioned_sidebars_json(pid):
    return json.dumps(
        {pid: [{"type": "autogenerated", "dirName": "."}]}, indent=2) + "\n"


def navbar_json():
    items = {}
    items["title"] = {"message": "Apusic Docs Center"}
    items["logo.alt"] = {"message": "Apusic"}
    for zh, en in [("中间件", "Middleware"), ("数据治理", "Data Governance"), ("AI 平台", "AI Platform")]:
        items["item.label." + zh] = {"message": en}
    return json.dumps(items, ensure_ascii=False, indent=2)


# AAS 安装指南目录树：4 份落盘位置（当前版 / V1.0 冻结版 / 英文 current / 英文 V1.0）
# 页面顺序由 frontmatter sidebar_position 决定；cluster 子目录经 _category_.json 成为「编（Part）」
AAS_INSTALL_ZH = {
    "index": installation_index_zh, "prereq": installation_prereq_zh,
    "standalone": installation_standalone_zh,
    "cluster/nodes": installation_nodes_zh, "cluster/ha": installation_ha_zh,
}
AAS_INSTALL_EN = {
    "index": installation_index_en, "prereq": installation_prereq_en,
    "standalone": installation_standalone_en,
    "cluster/nodes": installation_nodes_en, "cluster/ha": installation_ha_en,
}
AAS_CLUSTER_CATEGORY = {"zh": {"label": "集群安装", "position": 4},
                        "en": {"label": "Cluster Installation", "position": 4}}


def write_aas_installation():
    """写入 AAS 安装指南目录树（4 个落盘位置 × 5 页 + cluster/_category_.json）"""
    n = 0
    for lang, tpl in (("zh", AAS_INSTALL_ZH), ("en", AAS_INSTALL_EN)):
        if lang == "zh":
            roots = ["products/aas/docs",
                     "aas_versioned_docs/version-1.0"]
        else:
            roots = ["i18n/en/docusaurus-plugin-content-docs-aas/current",
                     "i18n/en/docusaurus-plugin-content-docs-aas/version-1.0"]
        for root in roots:
            for rel, fn in tpl.items():
                w(f"{root}/installation/{rel}.md", fn(PRODUCTS[0]))
                n += 1
            cat = AAS_CLUSTER_CATEGORY[lang]
            w(f"{root}/installation/cluster/_category_.json",
              json.dumps(cat, ensure_ascii=lang == "en", indent=2) + "\n")
            n += 1
    # AAS 扁平 installation.md 已被目录树取代，清理残留
    for stale in ("products/aas/docs/installation.md",
                  "aas_versioned_docs/version-1.0/installation.md",
                  "i18n/en/docusaurus-plugin-content-docs-aas/current/installation.md",
                  "i18n/en/docusaurus-plugin-content-docs-aas/version-1.0/installation.md"):
        path = os.path.join(ROOT, stale)
        if os.path.isfile(path):
            os.remove(path)
    return n


def main():
    # 清理旧版结构（历史生成的 products/<id>/versioned_docs 与 versions.json）
    for p in PRODUCTS:
        legacy = os.path.join(ROOT, "products", p["id"])
        for stale in ("versioned_docs", "versions.json"):
            stale_path = os.path.join(legacy, stale)
            if os.path.isdir(stale_path):
                shutil.rmtree(stale_path)
            elif os.path.isfile(stale_path):
                os.remove(stale_path)

    count = 0
    for p in PRODUCTS:
        pid = p["id"]
        # per-product sidebars（当前版本）
        w(f"products/{pid}/sidebars.ts", sidebars_ts(pid))
        # Docusaurus 多实例版本化文件（站点根目录 + 插件 ID 前缀）
        w(f"{pid}_versions.json", json.dumps(["1.0"], indent=2) + "\n")
        w(f"{pid}_versioned_sidebars/version-1.0-sidebars.json",
          versioned_sidebars_json(pid))

        for doc_id, pos, _, _ in DOCS:
            if pid == "aas" and doc_id == "installation":
                continue  # AAS 安装手册已目录化，见下方 write_aas_installation
            zh_md = ZH[doc_id](p)
            en_md = EN[doc_id](p)
            # 当前版本 V2.0
            w(f"products/{pid}/docs/{doc_id}.md", zh_md)
            # 冻结版本 V1.0（demo 中内容一致）
            w(f"{pid}_versioned_docs/version-1.0/{doc_id}.md", zh_md)
            # 英文翻译
            w(f"i18n/en/docusaurus-plugin-content-docs-{pid}/current/{doc_id}.md", en_md)
            w(f"i18n/en/docusaurus-plugin-content-docs-{pid}/version-1.0/{doc_id}.md", en_md)
            count += 4

        if pid == "aas":
            count += write_aas_installation()

    w("i18n/en/docusaurus-theme-classic/navbar.json", navbar_json())
    print(f"Generated {count} markdown files for {len(PRODUCTS)} products.")


if __name__ == "__main__":
    main()
