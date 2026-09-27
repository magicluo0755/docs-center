import React from 'react';
import clsx from 'clsx';
import {
  NavbarSecondaryMenuFiller,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import DocSidebarItems from '@theme/DocSidebarItems';
import SidebarProductHeader from '@site/src/components/SidebarProductHeader';

/**
 * 移动端抽屉侧边栏（基于 theme-classic 原组件的 eject 扩展）：
 * 在菜单列表上方注入「产品名 + 版本下拉」头部，并保留
 * 原有的「点击菜单项后收起抽屉」行为。
 */
// eslint-disable-next-line react/function-component-definition
const DocSidebarMobileSecondaryMenu = ({sidebar, path}) => {
  const mobileSidebar = useNavbarMobileSidebar();
  return (
    <>
      <SidebarProductHeader mobile />
      <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
        <DocSidebarItems
          items={sidebar}
          activePath={path}
          onItemClick={(item) => {
            // Mobile sidebar should only be closed if the category has a link
            if (item.type === 'category' && item.href) {
              mobileSidebar.toggle();
            }
            if (item.type === 'link') {
              mobileSidebar.toggle();
            }
          }}
          level={1}
        />
      </ul>
    </>
  );
};

export default function DocSidebarMobile(props): React.ReactElement {
  return (
    <NavbarSecondaryMenuFiller
      component={DocSidebarMobileSecondaryMenu}
      props={props}
    />
  );
}
