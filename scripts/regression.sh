#!/usr/bin/env bash
# 一键回归：站点路由巡检 + 搜索索引完整性 + PDF 出稿库存
# 用法：npm run verify（需先 build；站点未启动时会自动拉起 serve:static）
set -u
cd "$(dirname "$0")/.."

FAIL=0
step() { echo; echo "=== $1 ==="; }
ok()   { echo "  PASS: $1"; }
bad()  { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

# 固定走 127.0.0.1：localhost 在双栈环境可能解析到 ::1，
# 撞上手工启动的 docusaurus serve（已知版本化首页 404 缺陷）造成假失败。
# 端口独立于开发/预览常用端口（3000 开发、3200 演示），避免误测到
# 只编译单一语言的 dev 服务器（见技术文档 §10.7）。
# 可用 BASE_URL 覆盖（如 BASE_URL=http://127.0.0.1:3100 npm run verify）。
VERIFY_PORT="${VERIFY_PORT:-3210}"
BASE_URL="${BASE_URL:-http://127.0.0.1:$VERIFY_PORT}"

# ── 0. 站点可用性（未启动则拉起静态预览）─────────────────────
step "站点可用性"
if ! curl -sf -o NUL "$BASE_URL/"; then
  echo "  预览服务未启动，拉起 serve:static ..."
  node scripts/serve-static.js "$VERIFY_PORT" &
  SERVE_PID=$!
  sleep 2
fi
curl -sf -o NUL "$BASE_URL/" && ok "首页 200" || bad "首页不可达"

# ── 1. 全路由巡检：3 locale × 9 产品 × 2 版本首页 = 54 ────────
step "路由巡检（54 条）"
n=0; f=0
for loc in "" "zh-Hant/" "en/"; do
  for p in aas admq adc alb amdm adgp aig akm amem; do
    for v in "" "1.0/"; do
      code=$(curl -s -o NUL -w "%{http_code}" "$BASE_URL/$loc$p/$v")
      n=$((n+1))
      [ "$code" != "200" ] && { bad "/$loc$p/$v -> $code"; f=$((f+1)); }
    done
  done
done
[ "$f" -eq 0 ] && ok "$n 条全部 200" || bad "$f/$n 条失败"

# ── 2. 搜索索引完整性：3 locale 各 10 个子索引 ────────────────
step "搜索索引"
for loc in "" "zh-Hant/" "en/"; do
  name=${loc:-zh-Hans/}
  cnt=$(ls build/${loc}*/search-index.json build/${loc}aas/search-index.json 2>/dev/null | wc -l)
  # 根索引 + 9 产品索引
  files=0
  for f2 in "build/${loc}search-index.json" \
            build/${loc}aas/search-index.json build/${loc}admq/search-index.json \
            build/${loc}adc/search-index.json build/${loc}alb/search-index.json \
            build/${loc}amdm/search-index.json build/${loc}adgp/search-index.json \
            build/${loc}aig/search-index.json build/${loc}akm/search-index.json \
            build/${loc}amem/search-index.json; do
    [ -f "$f2" ] && files=$((files+1))
  done
  [ "$files" -eq 10 ] && ok "$name 10/10 索引" || bad "$name 仅 $files/10 索引"
done

# ── 3. PDF 库存：全量 + manuals.json 分册，按 i18n 翻译覆盖动态计算（缺失语言跳过）──
step "PDF 库存"
expected=$(node -e "console.log(require('./scripts/pdf/lang-coverage.js').expectedPdfCount())" 2>/dev/null || echo 54)
cnt=$(find output/pdf -name "*.pdf" ! -name "*updated*" ! -name "*tmp*" | wc -l)
[ "$cnt" -eq "$expected" ] && ok "${expected} 份齐" || bad "实有 $cnt 份（期望 ${expected}）"
miss=0
for p in aas admq adc alb amdm adgp aig akm amem; do
  for v in V1.0 V2.0; do
    for l in zh-Hans zh-Hant en; do
      f3=$(ls output/pdf/$p/$v/$l/*.pdf 2>/dev/null | grep -v updated | grep -v tmp | head -1)
      [ -z "$f3" ] && { bad "缺 output/pdf/$p/$v/$l/"; miss=$((miss+1)); }
    done
  done
done
[ "$miss" -eq 0 ] && ok "矩阵无缺口"

# ── 3b. 兜底稿检测：-updated.pdf 残留说明主文件被占用未替换（矩阵不一致）──
stale=$(find output/pdf -name "*-updated*.pdf" | wc -l)
[ "$stale" -eq 0 ] && ok "无 -updated 兜底残留" \
  || bad "存在 $stale 份 -updated 兜底稿：请关闭 PDF 预览/阅读器后重跑该语言出稿并替换主文件"

# ── 3c. 页脚动作行：编辑此页 / 下载 PDF ─────────────────────
step "页脚动作行"
if [ -d build/downloads/pdf ]; then
  ok "PDF 静态目录已随构建产出（$(find build/downloads/pdf -name '*.pdf' | wc -l) 份）"
else
  bad "缺 build/downloads/pdf：检查 npm run prepare:assets 是否执行"
fi

# PDF 路径本身含语言目录，baseUrl 若再带 locale 会出现 /en/downloads/pdf 错链
leak=$(grep -rl 'href="/en/downloads/pdf\|href="/zh-Hant/downloads/pdf' build --include=index.html 2>/dev/null | wc -l)
[ "$leak" -eq 0 ] && ok "PDF 链接无 locale 前缀污染" || bad "$leak 个页面的 PDF 链接带 locale 前缀"

check_action() {
  local url="$1" want_pdf="$2" want_src="$3"
  local f="build${url%/}/index.html"
  if [ ! -f "$f" ]; then bad "$url 页面不存在"; return; fi
  local got_pdf got_src
  got_pdf=$(grep -ao 'data-pdf-file="[^"]*"' "$f" | head -1 | sed 's/.*="//;s/"$//')
  got_src=$(grep -ao 'https://github.com/magicluo0755/docs-center/edit/main/[^"]*' "$f" | head -1 | sed 's#.*/edit/main/##')
  [ "$got_pdf" = "$want_pdf" ] && ok "$url → PDF $got_pdf" \
    || bad "$url PDF 期望 $want_pdf，实得 '${got_pdf:-无}'"
  [ "$got_src" = "$want_src" ] && ok "$url → MD $got_src" \
    || bad "$url MD 期望 $want_src，实得 '${got_src:-无}'"
}

# 唯一命中分册 → 下该分册
check_action "/aas/installation/standalone" \
  "aas-V2.0-zh-Hans-installation-guide.pdf" \
  "products/aas/docs/installation/standalone.md"
# 翻译版：PDF 走 en 目录，源文件指向 i18n 镜像
check_action "/en/aas/installation/standalone" \
  "aas-V2.0-en-installation-guide.pdf" \
  "i18n/en/docusaurus-plugin-content-docs-aas/current/installation/standalone.md"
# intro 被 3 本手册同时收录（歧义）→ 回退全量合集
check_action "/aas/intro" \
  "aas-V2.0-zh-Hans.pdf" \
  "products/aas/docs/intro.md"
# 冻结版本：PDF 走 V1.0，源文件指向站点根的版本目录
check_action "/aas/1.0/intro" \
  "aas-V1.0-zh-Hans.pdf" \
  "aas_versioned_docs/version-1.0/intro.md"
# 无分册的产品：直接给全量
check_action "/adc/intro" \
  "adc-V2.0-zh-Hans.pdf" \
  "products/adc/docs/intro.md"

# 非文档页不应出现动作项
if grep -q 'data-pdf-file=\|/edit/main/' build/index.html 2>/dev/null; then
  bad "首页不应显示下载/编辑入口"
else
  ok "首页无动作入口"
fi

# 全站：动作组必须在标题行内、链接全部有效（含 locale 前缀与文件存在性）
if node scripts/verify_doc_actions.js build >/tmp/doc-actions.log 2>&1; then
  ok "$(tr '\n' ' ' </tmp/doc-actions.log | sed 's/  */ /g')"
else
  bad "页脚动作行校验失败：$(tr '\n' ' ' </tmp/doc-actions.log | head -c 300)"
fi

# ── 3d. 侧边栏整体收起/展开（原生 themeConfig.docs.sidebar.hideable）──
step "侧边栏收纳"
check_collapse() {
  local url="$1" want="$2"
  local f="build${url%/}/index.html"
  if [ ! -f "$f" ]; then bad "$url 页面不存在"; return; fi
  grep -q 'collapseSidebarButton' "$f" \
    && ok "$url 有收起按钮" || bad "$url 缺收起按钮：检查 themeConfig.docs.sidebar.hideable"
  grep -q "title=\"$want\"" "$f" \
    && ok "$url 提示文案「$want」" || bad "$url 提示文案非「$want」"
}
check_collapse "/aas/intro" "收起侧边栏"
check_collapse "/zh-Hant/aas/intro" "收起側邊欄"
check_collapse "/en/aas/intro" "Collapse sidebar"

# 非文档页无侧边栏，不应出现该按钮
grep -q 'collapseSidebarButton' build/index.html 2>/dev/null \
  && bad "首页不应出现收起按钮" || ok "首页无收起按钮"

# ── 3e. 三语言互跳链路（语言下拉切换后不能 404）────────────────
step "语言切换链路"
if node scripts/verify_locale_links.js build >/tmp/locale-links.log 2>&1; then
  ok "$(tr '\n' ' ' </tmp/locale-links.log | sed 's/  */ /g')"
else
  bad "语言切换链路校验失败：$(tr '\n' ' ' </tmp/locale-links.log | head -c 300)"
fi

# ── 4. 搜索 E2E（三语言）─────────────────────────────────────
step "搜索 E2E"
node scripts/verify_search.js "$BASE_URL/aas/intro" "集群" reg-zh >/dev/null 2>&1 \
  && ok "zh-Hans 命中" || bad "zh-Hans 未命中"
node scripts/verify_search.js "$BASE_URL/zh-Hant/aas/intro" "集羣" reg-hant >/dev/null 2>&1 \
  && ok "zh-Hant 命中" || bad "zh-Hant 未命中"
node scripts/verify_search.js "$BASE_URL/en/aas/intro" "cluster" reg-en >/dev/null 2>&1 \
  && ok "en 命中" || bad "en 未命中"

[ -n "${SERVE_PID:-}" ] && kill "$SERVE_PID" 2>/dev/null

echo
if [ "$FAIL" -eq 0 ]; then
  echo "✔ 回归全部通过"
else
  echo "✘ 回归存在 $FAIL 项失败"
  exit 1
fi
