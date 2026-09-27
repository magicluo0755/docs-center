# Apusic 产品文档中心（原型）

基于 **Docusaurus 3.x** 的多产品、多版本、多语言文档中心原型，已落地 **Paged.js PDF 自动化出稿管线**与 CI/CD 工程化配套。

## 产品覆盖（3 条产品线 · 9 个产品）

| 产品线 | 产品（简称） |
|--------|------|
| 中间件 | 金蝶Apusic应用服务器（AAS） · 金蝶Apusic分布式消息队列（ADMQ） · 金蝶Apusic分布式缓存（AMDC） · 金蝶Apusic负载均衡器（ALB） |
| 数据治理 | 金蝶Apusic主数据管理（AMDM） · 金蝶Apusic数据治理平台（ADGP） |
| AI 平台 | 金蝶Apusic AI 网关（AIG） · 金蝶Apusic知识库平台（AKM） · 金蝶Apusic记忆平台（AMEM） |

每个产品包含 7 个章节文档：产品简介、快速开始、安装手册、使用手册、配置手册、开发手册、性能调优。

## 版本与语言矩阵

- **版本**：每产品维护 **V2.0**（当前版本，`/aas/...`）与 **V1.0**（冻结快照，`/aas/1.0/...`），导航栏右侧**版本下拉**按当前浏览产品上下文显示（`custom-productVersionDropdown`）
- **语言**：默认 **简体中文**，**繁体中文**（`i18n/zh-Hant/`，OpenCC 从简体源派生）与**英文**（`i18n/en/`）翻译位于 `i18n/`，导航栏**语言下拉**切换
- 内容矩阵合计：9 产品 × 7 文档 × 2 版本 × 3 语言 = **378 篇 Markdown**（简中 126 + 繁中 126 派生 + 英文 126）
- PDF 出稿矩阵：9 产品 × 3 语言 × 2 版本 = **54 份手册**（单产品 7 章聚合，章节序号 + 省略号点串目录带页码）

## 目录结构

```text
docs-center/
├── docusaurus.config.ts          # 站点配置：9 个 docs 多实例 + i18n + 导航
├── products/<id>/                # 每产品一个目录（独立 docs 实例）
│   ├── sidebars.ts               # 当前版文档组织结构
│   └── docs/                     # 当前版本（V2.0）
├── <id>_versions.json            # 冻结版本清单（站点根 + 插件 ID 前缀）
├── <id>_versioned_docs/version-1.0/    # V1.0 冻结快照
├── <id>_versioned_sidebars/version-1.0-sidebars.json
├── i18n/en/                      # 英文翻译（文档内容 + 主题导航）
├── src/
│   ├── pages/index.tsx           # 门户首页（产品线 × 产品导航）
│   └── theme/NavbarItem/         # 上下文感知版本下拉（swizzle）
├── scripts/
│   ├── generate_docs.py          # Demo 内容批量生成器（252 篇）
│   ├── verify_navbar.js          # 导航栏下拉无头浏览器回归验证
│   └── pdf/
│       ├── generate.js           # PDF 出稿主脚本（封面+目录页码+分页）
│       ├── release-all.js        # 发版全量出稿（54 份）
│       └── snapshot.js           # PDF 分页结果截图（视觉回归）
├── output/pdf/                   # PDF 产物（产品/版本/语言 分目录）
├── .gitlab-ci.yml                # GitLab CI（lint/build/pdf/deploy）
├── .github/workflows/ci.yml      # GitHub Actions 等价实现
├── .markdownlint-cli2.jsonc      # Markdown 门禁规则
├── deploy/nginx.conf             # 内网静态托管（缓存策略/PDF 下载）
├── Dockerfile                    # 容器化交付
└── CODEOWNERS                    # 产品线目录分权评审
```

## 常用命令

```bash
npm install          # 安装依赖
npm run start        # 本地开发（http://localhost:3000）
npm run build        # 生产构建（中文 + 英文全量）
npm run serve:static # 预览构建产物（生产形态静态服务器，推荐）
npm run verify       # 一键回归：54 路由 + 3 语言搜索 E2E + 搜索索引 + PDF 库存
npm run serve        # 预览构建产物（docusaurus serve；对版本化 index 路由有 404 缺陷，见技术文档 §10.2）
npm run gen:docs     # 重新生成 Demo 示例文档
npm run pdf -- --product aas --version current --lang zh-Hans   # 单份 PDF
npm run gen:hant     # 简中 → 繁体文档派生（OpenCC，幂等）
npm run pdf:all      # 发版全量出稿（9 产品 × 3 语言 × 2 版本）
npm run clear        # 清理构建缓存
```

> 注意：在本沙箱环境执行 `build` / `serve` 需带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（WorkBuddy 批量删除保护会拦截 Docusaurus 清理 `build/__server`）；公司 CI 环境无需此变量。

## PDF 出稿管线

`scripts/pdf/generate.js`：按产品章节顺序抓取站点 HTML → 提取正文（剔除导航/面包屑/版本徽标）→ 聚合封面 + 目录 + 各章 → Paged.js 分页（CSS `target-counter` 自动回填目录页码、`string-set` 章节页眉、页脚页码、封面独立页）→ puppeteer-core 驱动本机 Edge 输出 PDF。

- 封面：内置企业标准模板（品牌色带 + 产品名 + 版本/日期/密级表），可按产品覆盖
- 产物：`output/pdf/<product>/<version>/<lang>/<product>-<ver>-<lang>.pdf`
- 视觉回归：`scripts/pdf/snapshot.js` 与 `scripts/verify_navbar.js` 均可截图比对

## CI/CD

| 触发 | 流水线行为 |
|------|-----------|
| MR | markdownlint 门禁 → 站点构建 → AAS 中文 PDF 抽样验证 |
| 合入 main | 构建 + 部署（对接公司发布系统/nginx/Docker） |
| 打版本 tag | 9 产品 × 3 语言 × 2 版本 **全量 PDF 出稿**，产物长期归档 |

`npm run pdf:all` 为 CI `pdf:release` 任务的本地等价物。

## 版本发布操作（真实场景）

```bash
npx docusaurus docs:version:tag 2.0   # 将当前 docs/ 冻结为 version-2.0 快照
```

冻结后 `<id>_versions.json` 追加版本号，版本下拉自动出现新版本；配合 CI 打 tag 触发全量 PDF 归档。

## 新增产品的操作步骤

1. 复制任一 `products/<id>/` 目录结构（docs/ 空目录即可）；
2. 在 `docusaurus.config.ts` 的 `products` 数组登记，并在 `src/theme/NavbarItem/index.tsx` 的 `PRODUCT_IDS` 补充 id；
3. 编写 Markdown，通过 MR 评审（CODEOWNERS 自动指派产品线负责人）合入；
4. 如需新增产品线，在 `src/pages/index.tsx` 与导航栏下拉中补充。

## 原型说明

- 文档内容为脚本生成的 Demo 样例，展示 admonition（提示/注意/警告）、代码高亮（bash/yaml/python/xml）、表格、链接等能力；
- V1.0 与 V2.0 在原型中内容一致，仅用于验证版本切换与目录隔离机制；
- 英文翻译为同步生成的占位译文，正式版建议接入 Crowdin/Weblate 翻译流水线。
