import { Play } from 'lucide-react';
import { Space, Typography } from 'antd';
import type { Scenario } from '../../types';
import { PanelCard } from '../ui';

export function SurfaceScenarioList({
  scenarios,
  onOpenScenario
}: {
  scenarios: Scenario[];
  onOpenScenario: (id: string) => void;
}) {
  return (
    <PanelCard
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>关联剧本</Typography.Text>
          <Typography.Text type="secondary" className="zh-text-sm">
            {scenarios.length} 个
          </Typography.Text>
        </Space>
      }
      variant="borderless"
      className="zh-surface-panel-soft"
      bodyPadding={0}
    >
      <div className="zh-column-stack">
        {scenarios.map((scenario) => {
          const scenarioToneClass = ['critical', 'high'].includes(scenario.severity)
            ? ` zh-surface-scenario-dot--${scenario.severity}`
            : '';
          return (
            <div key={scenario.id} onClick={() => onOpenScenario(scenario.id)} className="zh-surface-scenario-item">
              <div className="zh-surface-scenario-main">
                <div className={`zh-surface-scenario-dot${scenarioToneClass}`} />
                <div>
                  <div>
                    <Typography.Text strong>{scenario.title}</Typography.Text>
                  </div>
                  <div className="zh-surface-scenario-meta">
                    <Typography.Text type="secondary" className="zh-text-sm">
                      {scenario.id} · {scenario.target}
                    </Typography.Text>
                  </div>
                </div>
              </div>
              <div>
                <Play size={16} color="var(--ant-color-text-secondary)" />
              </div>
            </div>
          );
        })}
        {!scenarios.length && <div className="zh-surface-empty">该攻击面暂无关联剧本。</div>}
      </div>
    </PanelCard>
  );
}
