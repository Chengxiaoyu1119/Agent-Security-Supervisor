import type { Config } from '@docusaurus/types';
import type { Preset } from '@docusaurus/preset-classic';

const siteUrl = process.env.AGENT_SUPERVISOR_DOCS_SITE_URL ?? 'https://agent-security-supervisor.local';
const wwwUrl = process.env.AGENT_SUPERVISOR_WWW_URL ?? 'http://127.0.0.1:4321';
const consoleUrl = process.env.AGENT_SUPERVISOR_CONSOLE_URL ?? 'http://127.0.0.1:5178';

const config: Config = {
  title: '智安哨文档站',
  tagline: 'Agent Security Supervisor documentation',
  favicon: 'img/logo.svg',
  url: siteUrl,
  baseUrl: '/',
  organizationName: 'agent-security-supervisor',
  projectName: 'agent-security-supervisor',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN']
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      title: '智安哨文档',
      logo: {
        alt: '智安哨',
        src: 'img/logo.svg'
      },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: '文档' },
        { to: '/quickstart', label: '快速开始', position: 'left' },
        { href: wwwUrl, label: '官网', position: 'right' },
        { href: consoleUrl, label: '控制台', position: 'right' }
      ]
    },
    footer: {
      style: 'light',
      copyright: `Copyright © ${new Date().getFullYear()} Agent Security Supervisor.`
    },
    prism: {
      additionalLanguages: ['powershell', 'bash', 'json']
    }
  } satisfies Preset.ThemeConfig
};

export default config;
