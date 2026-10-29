import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {ThemeClassNames} from '@docusaurus/theme-common';
import IconEdit from '@theme/Icon/Edit';
import DownloadPdfLink from '@site/src/components/DownloadPdfLink';
import styles from './styles.module.css';

/**
 * 文档页脚动作行：原生「编辑此页」+「下载 PDF」。
 * 编辑链接由 docs 插件的 editUrl 生成（见 docusaurus.config.ts），
 * 因此这里只负责把 PDF 链接并排放进来，不接管任何路径推导。
 */
export default function EditThisPage({
  editUrl,
}: {
  editUrl: string;
}): React.ReactElement {
  return (
    <div className={styles.row}>
      <Link to={editUrl} className={ThemeClassNames.common.editThisPage}>
        <IconEdit />
        <Translate
          id="theme.common.editThisPage"
          description="The link label to edit the current page">
          Edit this page
        </Translate>
      </Link>
      <DownloadPdfLink />
    </div>
  );
}
