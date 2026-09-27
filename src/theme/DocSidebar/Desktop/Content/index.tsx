import React from 'react';
import OriginalContent from '@theme-original/DocSidebar/Desktop/Content';
import SidebarProductHeader from '@site/src/components/SidebarProductHeader';

/**
 * 桌面端侧边栏：在导航菜单上方注入「产品名 + 版本下拉」头部。
 * 原组件返回 <nav class="menu">，包装后头部作为其兄弟节点
 * 渲染在侧边栏滚动容器（.sidebar）内，随内容一起滚动。
 */
export default function DocSidebarDesktopContentWrapper(
  props,
): React.ReactElement {
  return (
    <>
      <SidebarProductHeader />
      <OriginalContent {...props} />
    </>
  );
}
