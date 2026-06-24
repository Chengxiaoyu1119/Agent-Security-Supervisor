import type { Config } from '@docusaurus/types';
import type { Preset } from '@docusaurus/preset-classic';

const siteUrl = process.env.AGENT_SUPERVISOR_DOCS_SITE_URL ?? 'https://agent-security-supervisor.local';
const wwwUrl = process.env.AGENT_SUPERVISOR_WWW_URL ?? 'http://127.0.0.1:4321';
const consoleUrl = process.env.AGENT_SUPERVISOR_CONSOLE_URL ?? 'http://127.0.0.1:5178';

const config: Config = {
  title: 'Agent Security Supervisor Docs',
  tagline: '工具调用监督、攻击复现和 Agent 安全集成手册',
  favicon: 'img/logo.svg',
  url: siteUrl,
  baseUrl: '/',
  organizationName: 'agent-security-supervisor',
  projectName: 'agent-security-supervisor',
  scripts: [{ src: '/js/silence-react-devtools-prompt.js', async: false }],
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
      title: 'Agent Security Supervisor',
      logo: {
        alt: '智安哨',
        src: 'img/logo.svg'
      },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: '文档' },
        { to: '/quickstart', label: '快速开始', position: 'left' },
        { href: wwwUrl, label: '官网', position: 'right' },
        { href: consoleUrl, label: '控制台', position: 'right' },
        {
          href: 'https://github.com/Chengxiaoyu1119/agent-security-supervisor',
          label: 'GitHub',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub 仓库'
        }
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
