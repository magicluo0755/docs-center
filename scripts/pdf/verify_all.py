import glob, os
import pymupdf
base = r'C:/Users/Laurence Luo\WorkBuddy\2026-09-24-22-57-12\docs-center\output\pdf'
pdfs = sorted(glob.glob(os.path.join(base, '*', 'V*', '*', '*.pdf')))
pdfs = [p for p in pdfs if 'updated' not in os.path.basename(p)]
print('PDF count:', len(pdfs))
bad = 0
for p in pdfs:
    doc = pymupdf.open(p)
    toc = doc.get_toc()
    if len(toc) < 20:
        print('LOW BOOKMARKS:', p, len(toc)); bad += 1
    doc.close()
print('all bookmark checks passed' if bad == 0 else f'{bad} problems')
# 抽查繁体目录文本
doc = pymupdf.open(os.path.join(base, 'aas', 'V2.0', 'zh-Hant', 'aas-V2.0-zh-Hant.pdf'))
for i in range(min(6, doc.page_count)):
    t = doc[i].get_text()
    if '目 錄' in t:
        lines = [l.strip() for l in t.splitlines() if l.strip()][:8]
        print('\n'.join(lines))
        break
