# PDF 自动化出稿管线（已实现）

目标：按产品 × 版本 × 语言组合，自动生成标准 PDF 离线文档（自动目录带页码、封面参数化、Web/PDF 视觉一致）。

## 使用方法

```bash
# 前置：已 npm run build 且启动预览（npx docusaurus serve --port 3000）
node scripts/pdf/generate.js --product aas --version current --lang zh-Hans
node scripts/pdf/generate.js --product aig --version 1.0   --lang en
# 参数：--product 产品ID / --version current|1.0 / --lang zh-Hans|en / --base 站点地址
# 产物：output/pdf/<product>/<version>/<lang>/<product>-<version>-<lang>.pdf

# 质量验证辅助：分页结果截图（封面/目录/正文前 N 页）
node scripts/pdf/snapshot.js --product aas --version current --lang zh-Hans --pages 3
```

## 管线实现

```text
Docusaurus 构建产物（HTML，含 admonition / 代码高亮样式）
  → 按 sidebar 章节顺序抓取各页面，提取 <article> 正文（剔除导航/面包屑/版本徽标）
  → 聚合：企业标准封面模板（产品名/版本/日期/密级参数化） + 自动目录页 + 各章节
  → Paged.js 分页：@page 页眉页脚页码、章节起新页、target-counter 自动回填目录页码
  → puppeteer-core 驱动本机 Edge 无头渲染输出 PDF
```

## 目录规划

```text
scripts/pdf/
├── cover/                    # 封面模板库
│   ├── default.html          # 内置企业标准封面（Handlebars 模板）
│   └── default.css
├── paged.polyfill.js         # Paged.js 运行时（随构建注入）
├── generate.js               # 主脚本：爬取 → 聚合 → 分页 → 输出（正式版实现）
└── manual-config.yaml        # 手册清单：产品/版本/语言 → sidebar 章节映射
```

## 关键 CSS 能力（正式版实现要点）

- 自动目录页码：`a::after { content: target-counter(attr(href url), page); }`
- 页眉页脚与页码：`@page { @bottom-right: counter(page); @top-center: string(chapter); }`
- 章节起新页：`.chapter { break-before: page; }`
- 封面独立页面：`@page :first { margin: 0; }` + 全幅封面模板

## 触发策略（接入 CI 后）

1. 产品发版 MR 合并 → 构建该产品当前发布版本 × 2 语言全量 PDF；
2. 冻结版本修订合入 → 基于文件映射增量构建受影响手册；
3. 手动触发 → 门户后台按任意 产品×版本×语言 组合即时出稿。

产物命名规范：`{product}/{version}/{lang}/{manual}-{semver}-{date}.pdf`
