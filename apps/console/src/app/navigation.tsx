import type { JSX } from 'react';
import {
  ClipboardList,
  FileWarning,
  FlaskConical,
  GitBranch,
  Play,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'scenarios'
  | 'lab'
  | 'chain'
  | 'audit'
  | 'policy'
  | 'alerts'
  | 'report'
  | 'settings';

export type NavItem = {
  key: PageKey;
  label: string;
  icon: JSX.Element;
};

export type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

export const defaultPage: PageKey = 'dashboard';

export const navGroups: NavGroup[] = [
  {
    key: 'research',
    label: '攻击研究',
    items: [
      { key: 'dashboard', label: '攻击面研究台', icon: <FlaskConical size={18} /> },
      { key: 'scenarios', label: '攻击脚本库', icon: <ClipboardList size={18} /> }
    ]
  },
  {
    key: 'replay',
    label: '攻击复现',
    items: [
      { key: 'lab', label: '攻击功能实验台', icon: <Play size={18} /> },
      { key: 'chain', label: '多 Agent 攻击链', icon: <GitBranch size={18} /> }
    ]
  },
  {
    key: 'defense',
    label: '监督防御',
    items: [
      { key: 'audit', label: '行为监督记录', icon: <ScrollText size={18} /> },
      { key: 'policy', label: '防御策略中心', icon: <ShieldCheck size={18} /> },
      { key: 'alerts', label: '告警与阻断', icon: <ShieldAlert size={18} /> }
    ]
  },
  {
    key: 'delivery',
    label: '验收交付',
    items: [
      { key: 'report', label: '评测报告', icon: <FileWarning size={18} /> },
      { key: 'settings', label: '模型与设置', icon: <Settings2 size={18} /> }
    ]
  }
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function isPageKey(value: string): value is PageKey {
  return navItems.some((item) => item.key === value);
}

export function pageFromHash(hash: string): PageKey {
  const page = hash.replace(/^#\/?/, '').split(/[?#]/)[0].trim();
  return isPageKey(page) ? page : defaultPage;
}

export function pageToHash(page: PageKey) {
  return `#/${page}`;
}
