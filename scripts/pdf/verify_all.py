import glob, json, os
import pymupdf

# PDF 出稿校验：库存计数 + 书签阈值（全量合集 ≥20，分册 ≥5）
# 路径基于脚本位置解析，迁移/换盘后依然有效
base = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'output', 'pdf'))
pdfs = sorted(glob.glob(os.path.join(base, '*', 'V*', '*', '*.pdf')))
pdfs = [p for p in pdfs if 'updated' not in os.path.basename(p)]
print('PDF count:', len(pdfs))

# 从 manuals.json 识别分册文件名（<product>-<ver>-<lang>-<manualId>.pdf）
manual_ids = set()
mpath = os.path.join(os.path.dirname(__file__), 'manuals.json')
if os.path.exists(mpath):
    m = json.load(open(mpath, encoding='utf-8'))
    for e in m.values():
        if not isinstance(e, dict):
            continue
        for v in ('current', '1.0'):
            lst = ((e.get('versions') or {}).get(v) or {}).get('manuals') or e.get('manuals') or []
            for manu in lst:
                manual_ids.add(manu['id'])

bad = 0
for p in pdfs:
    doc = pymupdf.open(p)
    toc = doc.get_toc()
    name = os.path.basename(p)
    is_manual = any(name.endswith(f'-{mid}.pdf') for mid in manual_ids)
    threshold = 5 if is_manual else 20
    if len(toc) < threshold:
        print('LOW BOOKMARKS:', p, len(toc))
        bad += 1
    doc.close()
print('all bookmark checks passed' if bad == 0 else f'{bad} problems')

# 抽查繁体目录文本
sample = os.path.join(base, 'aas', 'V2.0', 'zh-Hant', 'aas-V2.0-zh-Hant.pdf')
if os.path.exists(sample):
    doc = pymupdf.open(sample)
    for i in range(min(6, doc.page_count)):
        t = doc[i].get_text()
        if '目 錄' in t:
            lines = [l.strip() for l in t.splitlines() if l.strip()][:8]
            print('\n'.join(lines))
            break
    doc.close()
