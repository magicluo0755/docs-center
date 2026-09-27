import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {localeFromPath} from '@site/src/utils/products';
import type {Locale} from '@site/src/utils/products';

type P = {id: string; abbr: string; zh: string; hant: string; en: string; desc: Record<Locale, string>};

const LINES: {name: Record<Locale, string>; desc: Record<Locale, string>; products: P[]}[] = [
  {
    name: {['zh-Hans']: '中间件产品线', ['zh-Hant']: '中間件產品線', en: 'Middleware'} as Record<Locale, string>,
    desc: {
      ['zh-Hans']: '应用运行与流量治理基础设施',
      ['zh-Hant']: '應用運行與流量治理基礎設施',
      en: 'Application runtime and traffic governance infrastructure',
    } as Record<Locale, string>,
    products: [
      {id: 'aas', abbr: 'AAS', zh: '应用服务器', hant: '應用服務器', en: 'Application Server', desc: {['zh-Hans']: '面向云原生与企业关键业务的新一代应用服务器中间件', ['zh-Hant']: '面向雲原生與企業關鍵業務的新一代應用服務器中間件', en: 'Next-generation application server for cloud-native and mission-critical workloads'} as Record<Locale, string>},
      {id: 'admq', abbr: 'ADMQ', zh: '分布式消息队列', hant: '分佈式消息隊列', en: 'Message Queue', desc: {['zh-Hans']: '高吞吐、低延迟的企业级消息中间件', ['zh-Hant']: '高吞吐、低延遲的企業級消息中間件', en: 'High-throughput, low-latency enterprise messaging'} as Record<Locale, string>},
      {id: 'adc', abbr: 'ADC', zh: '分布式缓存', hant: '分佈式緩存', en: 'Distributed Cache', desc: {['zh-Hans']: '兼容 Redis 协议的弹性分布式缓存服务', ['zh-Hant']: '相容 Redis 協議的彈性分佈式緩存服務', en: 'Elastic distributed cache, Redis compatible'} as Record<Locale, string>},
      {id: 'alb', abbr: 'ALB', zh: '负载均衡器', hant: '負載均衡器', en: 'Load Balancer', desc: {['zh-Hans']: '四层/七层一体化负载均衡与流量入口', ['zh-Hant']: '四層/七層一體化負載均衡與流量入口', en: 'L4/L7 load balancing and traffic entrypoint'} as Record<Locale, string>},
    ],
  },
  {
    name: {['zh-Hans']: '数据治理产品线', ['zh-Hant']: '數據治理產品線', en: 'Data Governance'} as Record<Locale, string>,
    desc: {
      ['zh-Hans']: '数据资产管理与价值释放平台',
      ['zh-Hant']: '數據資產管理與價值釋放平臺',
      en: 'Data asset management and value realization',
    } as Record<Locale, string>,
    products: [
      {id: 'amdm', abbr: 'AMDM', zh: '主数据管理', hant: '主數據管理', en: 'Master Data Management', desc: {['zh-Hans']: '多域主数据统一建模、治理与分发', ['zh-Hant']: '多域主數據統一建模、治理與分發', en: 'Unified modeling, governance and distribution of master data'} as Record<Locale, string>},
      {id: 'adgp', abbr: 'ADGP', zh: '数据治理平台', hant: '數據治理平臺', en: 'Data Governance Platform', desc: {['zh-Hans']: '数据资产目录、元数据、标准与质量一体化治理', ['zh-Hant']: '數據資產目錄、元數據、標準與質量一體化治理', en: 'Asset catalog, metadata, standards and quality in one platform'} as Record<Locale, string>},
    ],
  },
  {
    name: {['zh-Hans']: 'AI 平台产品线', ['zh-Hant']: 'AI 平臺產品線', en: 'AI Platform'} as Record<Locale, string>,
    desc: {
      ['zh-Hans']: '企业级 AI 应用使能与运营平台',
      ['zh-Hant']: '企業級 AI 應用使能與運營平臺',
      en: 'Enterprise AI application enablement and operations',
    } as Record<Locale, string>,
    products: [
      {id: 'aig', abbr: 'AIG', zh: 'AI 网关', hant: 'AI 網關', en: 'AI Gateway', desc: {['zh-Hans']: '多模型统一接入与 Agent 工具调用管控', ['zh-Hant']: '多模型統一接入與 Agent 工具調用管控', en: 'Unified model access and Agent tool-call governance'} as Record<Locale, string>},
      {id: 'akm', abbr: 'AKM', zh: '知识库平台', hant: '知識庫平臺', en: 'Knowledge Base Platform', desc: {['zh-Hans']: '企业知识接入、检索增强（RAG）与应用集成', ['zh-Hant']: '企業知識接入、檢索增強（RAG）與應用集成', en: 'Knowledge ingestion, RAG and application integration'} as Record<Locale, string>},
      {id: 'amem', abbr: 'AMEM', zh: '记忆平台', hant: '記憶平臺', en: 'Memory Platform', desc: {['zh-Hans']: '面向 AI 应用的长期记忆存储与混合检索', ['zh-Hant']: '面向 AI 應用的長期記憶存儲與混合檢索', en: 'Long-term memory storage and hybrid retrieval for AI apps'} as Record<Locale, string>},
    ],
  },
];

const HERO = {
  ['zh-Hans']: {title: 'Apusic 产品文档中心', subtitle: '多产品 · 多版本 · 多语言 一体化文档平台', layoutTitle: '文档中心', layoutDesc: 'Apusic 多产品多版本多语言文档中心'},
  ['zh-Hant']: {title: 'Apusic 產品文檔中心', subtitle: '多產品 · 多版本 · 多語言 一體化文檔平臺', layoutTitle: '文檔中心', layoutDesc: 'Apusic 多產品多版本多語言文檔中心'},
  en: {title: 'Apusic Product Documentation', subtitle: 'One platform for all products, versions and languages', layoutTitle: 'Documentation Center', layoutDesc: 'Apusic multi-product, multi-version, multi-language documentation center'},
} as Record<Locale, {title: string; subtitle: string; layoutTitle: string; layoutDesc: string}>;

export default function Home(): React.ReactElement {
  const {pathname} = useLocation();
  const locale = localeFromPath(pathname);
  const t = HERO[locale];
  const nameOf = (p: P) => (locale === 'en' ? p.en : locale === 'zh-Hant' ? p.hant : p.zh);
  return (
    <Layout title={t.layoutTitle} description={t.layoutDesc}>
      <header className="hero hero--primary heroBanner">
        <div className="container">
          <h1 className="hero__title">{t.title}</h1>
          <p className="hero__subtitle">{t.subtitle}</p>
        </div>
      </header>
      <main className="container margin-vert--lg">
        {LINES.map((line) => (
          <section key={line.name.en} className="margin-bottom--xl">
            <h2>{line.name[locale]}</h2>
            <p className="text--muted">{line.desc[locale]}</p>
            <div className="row">
              {line.products.map((p) => (
                <div className="col col--4 margin-bottom--md" key={p.id}>
                  <Link
                    to={`/${p.id}/intro`}
                    className="card shadow--tl padding--lg productCard">
                    <h3>
                      {p.abbr} · {nameOf(p)}
                    </h3>
                    <p className="text--muted">{p.en}</p>
                    <p>{p.desc[locale]}</p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </Layout>
  );
}
