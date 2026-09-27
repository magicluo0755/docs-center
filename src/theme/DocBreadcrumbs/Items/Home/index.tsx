import React from 'react';
import Link from '@docusaurus/Link';
import OriginalHomeBreadcrumbItem from '@theme-original/DocBreadcrumbs/Items/Home';
import {useLocation} from '@docusaurus/router';
import {
  resolveProductContext,
  productName,
  localePrefix,
  localeFromPath,
} from '@site/src/utils/products';

/**
 * 面包屑扩展（Red Hat 式四级层级）：
 * 首页 > 产品名 > 版本 > 文档标题。
 * 通过包装 Home 面包屑项，在其后追加「产品名」「版本」两个可点击层级，
 * 均指向对应版本上下文下的产品首页（当前版 /<pid>/，冻结版 /<pid>/1.0/）。
 * 与 Red Hat 文档一致：产品名与版本层级落点是同一版本化产品首页。
 * 非产品文档页自动不追加（仅渲染原 Home 项）。
 */
export default function HomeBreadcrumbItemWrapper(): React.ReactElement {
  const {pathname} = useLocation();
  const locale = localeFromPath(pathname);
  const ctx = resolveProductContext(pathname);
  if (!ctx) {
    return <OriginalHomeBreadcrumbItem />;
  }
  const prefix = localePrefix(locale);
  const {product, versionLabel} = ctx;
  // 当前版本（V2.0）产品首页为根路径；V1.0 冻结版为 /1.0/ 前缀路径
  const versionPath = versionLabel === 'V1.0' ? '/1.0' : '';
  const productNameText = productName(product, locale);
  const productHomeHref = `${prefix}/${product.id}${versionPath}/`;

  return (
    <>
      <OriginalHomeBreadcrumbItem />
      <li className="breadcrumbs__item">
        <Link className="breadcrumbs__link" href={productHomeHref}>
          <span>{productNameText}</span>
        </Link>
      </li>
      <li className="breadcrumbs__item">
        <Link className="breadcrumbs__link" href={productHomeHref}>
          <span>{versionLabel}</span>
        </Link>
      </li>
    </>
  );
}
