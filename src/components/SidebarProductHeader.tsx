import React from 'react';
import {useLocation} from '@docusaurus/router';
import DocsVersionDropdownNavbarItem from '@theme/NavbarItem/DocsVersionDropdownNavbarItem';
import {resolveProductContext, productName, localeFromPath} from '@site/src/utils/products';

/**
 * 侧边栏顶部「产品名 + 版本下拉」头部（Red Hat 文档形态）。
 * 侧边栏仅在文档页渲染，因此 resolveProductContext 必然命中。
 */
export default function SidebarProductHeader({mobile = false}): React.ReactElement | null {
  const {pathname} = useLocation();
  const ctx = resolveProductContext(pathname);
  if (!ctx) {
    return null;
  }
  const locale = localeFromPath(pathname);
  const name = productName(ctx.product, locale);
  const versionLabel = locale === 'en' ? 'Version:' : '版本：';
  return (
    <div className="sidebar-product-header">
      <span className="sph-product" title={name}>
        {name}
      </span>
      <div className="sph-version-row">
        <span className="sph-version-label">{versionLabel}</span>
        <DocsVersionDropdownNavbarItem
          docsPluginId={ctx.product.id}
          mobile={mobile}
          dropdownActiveClassDisabled
          dropdownItemsBefore={[]}
          dropdownItemsAfter={[]}
        />
      </div>
    </div>
  );
}
