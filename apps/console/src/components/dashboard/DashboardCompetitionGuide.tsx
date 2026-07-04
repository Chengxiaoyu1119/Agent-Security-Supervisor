import type { JSX } from 'react';
import { FileWarning, FlaskConical, Play, ShieldCheck } from 'lucide-react';
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
  const items: CompetitionGuideItem[] = [
    {
      title: '攻击研究',
      desc: '覆盖提示注入、模型越狱、数据泄露等 7 类攻击面，沉淀对抗样本、越狱用例和脚本证据。',
      metric: `${completeSurfaceCount}/${overview.summary.surface_count} 类攻击面完整`,
      icon: <FlaskConical size={18} />,
      action: '查看脚本库',
      page: 'scenarios'
    },
    {
      title: '攻击复现',
      desc: '在本地靶场、真实模型优先链路和授权公网靶场中运行攻击输入、工具调用与攻防对比。',
      metric: `${overview.summary.scenario_count} 个可运行脚本`,
      icon: <Play size={18} />,
      action: '进入实验台',
      page: 'lab'
    },
    {
      title: '监督防御',
      desc: '对工具调用、代码执行、文件访问、API 与记忆写入进行审计，输出允许、拒绝、询问和隔离。',
      metric: `${overview.audit_logs.length} 条审计记录`,
      icon: <ShieldCheck size={18} />,
      action: '查看审计',
      page: 'audit'
    },
    {
      title: '验收交付',
      desc: '汇总风险分析、阻断率、误报率、OpenClaw 接入、模型代理和答辩证据包。',
      metric: `${guardedControlRate}% 有防护运行控制率`,
      icon: <FileWarning size={18} />,
      action: '打开报告',
      page: 'report'
    }
  ];

  return (
    <PanelCard
      title={
        <Space>
          <FlaskConical size={18} color="var(--ant-color-primary)" />
          <Typography.Text strong>赛事功能分类导览</Typography.Text>
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
