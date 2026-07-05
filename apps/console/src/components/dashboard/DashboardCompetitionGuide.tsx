import type { JSX } from 'react';
import { BrainCircuit, FileWarning, FlaskConical, Play, ShieldCheck, SlidersHorizontal, Wrench } from 'lucide-react';
import { Space, Typography } from 'antd';
import type { PageKey } from '@/app/navigation';
import type { Overview } from '@/types';
import { PanelCard } from '../ui';

type CompetitionGuideItem = {
  title: string;
  desc: string;
  metric: string;
  icon: JSX.Element;
  action: string;
  page: PageKey;
};

export function DashboardCompetitionGuide({
  overview,
  completeSurfaceCount,
  onOpenPage
}: {
  overview: Overview;
  completeSurfaceCount: number;
  onOpenPage: (page: PageKey) => void;
}) {
  const guardedControlRate = overview.summary.guarded_control_rate ?? overview.summary.block_rate;
  const configuredModelCount = overview.models.filter((model) => model.configured).length;
  const items: CompetitionGuideItem[] = [
    {
      title: '攻击面研究',
      desc: '覆盖提示注入、模型越狱、数据泄露、滥用风险、工具劫持、记忆中毒、环境污染 7 类攻击面。',
      metric: `${completeSurfaceCount}/${overview.summary.surface_count} 类攻击面完整`,
      icon: <FlaskConical size={18} />,
      action: '查看脚本库',
      page: 'scenarios'
    },
    {
      title: '复现实验台',
      desc: '从页面选择攻击脚本，真实触发本地受控环境工具调用、监督判定、审计落库和防护对比。',
      metric: `${overview.summary.scenario_count} 个可运行脚本`,
      icon: <Play size={18} />,
      action: '进入实验台',
      page: 'lab'
    },
    {
      title: '模型安全链路',
      desc: '主模型、副模型和本地过滤器分工处理越狱检测、提示优化、输出过滤和真实 API 兜底。',
      metric: `${configuredModelCount}/${overview.models.length} 个模型已配置`,
      icon: <BrainCircuit size={18} />,
      action: '配置模型',
      page: 'settings'
    },
    {
      title: '工具监督审计',
      desc: '对文件、邮件、API、代码执行和记忆工具进行执行前审计，记录来源、参数、动作和证据 hash。',
      metric: `${overview.audit_logs.length} 条审计记录`,
      icon: <Wrench size={18} />,
      action: '查看审计',
      page: 'audit'
    },
    {
      title: '策略防御闭环',
      desc: '把允许、拒绝、询问、隔离和输出过滤做成可调策略，支持阈值校准和策略消融验证。',
      metric: `${guardedControlRate}% 有防护运行控制率`,
      icon: <ShieldCheck size={18} />,
      action: '调整策略',
      page: 'policy'
    },
    {
      title: '证据与验收',
      desc: '汇总风险报告、脚本运行结果、阻断记录、OpenClaw 接入和提交材料所需的证据包。',
      metric: `${overview.recent_runs.length} 条近期运行`,
      icon: <FileWarning size={18} />,
      action: '打开报告',
      page: 'report'
    }
  ];

  return (
    <PanelCard
      title={
        <Space>
          <SlidersHorizontal size={18} color="var(--ant-color-primary)" />
          <Typography.Text strong>方向一功能分区入口</Typography.Text>
        </Space>
      }
      variant="borderless"
      bodyPadding={20}
    >
      <div className="zh-competition-guide-grid">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            className="zh-competition-guide-item"
            onClick={() => onOpenPage(item.page)}
          >
            <span className="zh-competition-guide-item__icon">{item.icon}</span>
            <span className="zh-competition-guide-item__main">
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
              <em>{item.metric}</em>
            </span>
            <span className="zh-competition-guide-item__action">{item.action}</span>
          </button>
        ))}
      </div>
    </PanelCard>
  );
}
