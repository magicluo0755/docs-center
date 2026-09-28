#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
繁体中文（zh-Hant）文档派生脚本

将简体中文文档经 OpenCC（s2t）转换为繁体，写入 i18n/zh-Hant/ 对应目录：
  - products/<id>/docs/*.md                 → i18n/zh-Hant/docusaurus-plugin-content-docs-<id>/current/
  - <id>_versioned_docs/version-1.0/*.md    → i18n/zh-Hant/docusaurus-plugin-content-docs-<id>/version-1.0/

幂等可重复执行：每次全量重建 zh-Hant 目录（先清空后写入），
简体源文件始终为唯一事实来源（single source of truth）。

用法：
  python scripts/generate_hant.py          # 转换全部产品
  python scripts/generate_hant.py aas adc  # 仅转换指定产品
"""
import json
import shutil
import sys
from pathlib import Path

from opencc import OpenCC

ROOT = Path(__file__).resolve().parent.parent
I18N_HANT = ROOT / "i18n" / "zh-Hant"
PLUGIN_DIR_PREFIX = "docusaurus-plugin-content-docs-"
cc = OpenCC("s2t")

PRODUCTS = [
    "aas", "admq", "adc", "alb",
    "amdm", "adgp",
    "aig", "akm", "amem",
]


def convert_text(text: str) -> str:
    return cc.convert(text)


def convert_tree(src_dir: Path, dst_dir: Path) -> int:
    """递归转换 src_dir 下全部 .md/.mdx 到 dst_dir，返回文件数"""
    count = 0
    if not src_dir.is_dir():
        return count
    for src in sorted(src_dir.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(src_dir)
        dst = dst_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix in {".md", ".mdx"}:
            dst.write_text(convert_text(src.read_text(encoding="utf-8")), encoding="utf-8")
        elif src.suffix == ".json":
            # _category_.json 等配置中的中文标签（如编名）一并转换
            dst.write_text(convert_text(src.read_text(encoding="utf-8")), encoding="utf-8")
        else:
            shutil.copy2(src, dst)  # 非文本资源原样复制
        count += 1
    return count


def main() -> None:
    targets = sys.argv[1:] or PRODUCTS
    unknown = [t for t in targets if t not in PRODUCTS]
    if unknown:
        sys.exit(f"unknown products: {unknown}")

    # 清空重建，保证与简体源完全同步
    if I18N_HANT.exists():
        shutil.rmtree(I18N_HANT)

    total = 0
    for pid in targets:
        n1 = convert_tree(ROOT / "products" / pid / "docs",
                          I18N_HANT / (PLUGIN_DIR_PREFIX + pid) / "current")
        n2 = convert_tree(ROOT / f"{pid}_versioned_docs" / "version-1.0",
                          I18N_HANT / (PLUGIN_DIR_PREFIX + pid) / "version-1.0")
        print(f"[zh-Hant] {pid}: current={n1} version-1.0={n2}")
        total += n1 + n2

    # 主题级翻译（导航栏等）
    theme_dir = I18N_HANT / "docusaurus-theme-classic"
    theme_dir.mkdir(parents=True, exist_ok=True)
    navbar = {
        "title": {"message": "Apusic 產品文檔中心"},
        "logo.alt": {"message": "Apusic"},
        "item.label.首页": {"message": "首頁"},
        "item.label.中间件": {"message": "中間件"},
        "item.label.数据治理": {"message": "數據治理"},
        "item.label.AI 平台": {"message": "AI 平臺"},
    }
    # 产品下拉项标签（与 docusaurus.config.ts products label 一致，逐项转换）
    product_labels = {
        "金蝶Apusic应用服务器": "金蝶Apusic應用服務器", "金蝶Apusic分布式消息队列": "金蝶Apusic分佈式消息隊列",
        "金蝶Apusic分布式缓存": "金蝶Apusic分佈式緩存", "金蝶Apusic负载均衡器": "金蝶Apusic負載均衡器",
        "金蝶Apusic主数据管理": "金蝶Apusic主數據管理", "金蝶Apusic数据治理平台": "金蝶Apusic數據治理平臺",
        "金蝶Apusic AI 网关": "金蝶Apusic AI 網關", "金蝶Apusic知识库平台": "金蝶Apusic知識庫平臺",
        "金蝶Apusic记忆平台": "金蝶Apusic記憶平臺",
    }
    navbar.update({
        f"item.label.{k}": {"message": v}
        for k, v in product_labels.items()
    })
    (theme_dir / "navbar.json").write_text(
        json.dumps(navbar, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[zh-Hant] done: {total} docs + navbar.json")


if __name__ == "__main__":
    main()
