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
# 可用 BASE_URL 覆盖（如 BASE_URL=http://127.0.0.1:3100 npm run verify）。
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"

# ── 0. 站点可用性（未启动则拉起静态预览）─────────────────────
step "站点可用性"
if ! curl -sf -o NUL "$BASE_URL/"; then
  echo "  预览服务未启动，拉起 serve:static ..."
  node scripts/serve-static.js 3000 &
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

# ── 3. PDF 库存：全量 54 份 + manuals.json 分册（每册 3 语言 × 2 版本）──
step "PDF 库存"
expected=$(node -e "
const m=require('./scripts/pdf/manuals.json');
let n=54;
for(const e of Object.values(m||{})){
  for(const v of ['current','1.0']){
    const list=(((e.versions||{})[v]||{}).manuals)||e.manuals||[];
    n+=list.length*3;
  }
}
console.log(n);
" 2>/dev/null || echo 54)
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
