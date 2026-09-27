import os
import pymupdf
base = r'C:/Users/Laurence Luo\WorkBuddy\2026-09-24-22-57-12\docs-center\output\pdf\aas\V2.0'
outdir = r'C:/Users/Laurence Luo\WorkBuddy\2026-09-24-22-57-12'
for lang, mark in [('zh-Hans', '目 录'), ('en', 'Table of Contents')]:
    doc = pymupdf.open(os.path.join(base, lang, f'aas-V2.0-{lang}.pdf'))
    print('==', lang, 'pages:', doc.page_count)
    for i in range(min(doc.page_count, 6)):
        t = doc[i].get_text()
        if mark in t:
            lines = [l.strip() for l in t.splitlines() if l.strip()][:16]
            print('\n'.join(lines))
            doc[i].get_pixmap(dpi=110).save(os.path.join(outdir, f'toc-{lang}.png'))
            break
    for i in range(doc.page_count):
        t = doc[i].get_text()
        if ('第二章' in t or 'CHAPTER 2.' in t) and i > 4:
            doc[i].get_pixmap(dpi=110).save(os.path.join(outdir, f'chap-{lang}.png'))
            print('chapter page:', i + 1)
            break
