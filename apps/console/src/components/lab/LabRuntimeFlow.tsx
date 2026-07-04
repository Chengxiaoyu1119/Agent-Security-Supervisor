import { Typography } from 'antd';

export type LabRuntimeFlowStep = {
  label: string;
  detail: string;
  tone?: 'neutral' | 'active' | 'success' | 'warning';
};

type LabRuntimeFlowProps = {
  title?: string;
  steps: LabRuntimeFlowStep[];
  compact?: boolean;
};

export function LabRuntimeFlow({ title = '运行闭环', steps, compact = false }: LabRuntimeFlowProps) {
  return (
    <div className={`zh-lab-runtime-flow${compact ? ' zh-lab-runtime-flow--compact' : ''}`}>
      <Typography.Text strong className="zh-lab-runtime-flow__title">
        {title}
      </Typography.Text>
      <div className="zh-lab-runtime-flow__grid">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className="zh-lab-runtime-flow__step">
            <span className={`zh-lab-runtime-flow__index zh-lab-runtime-flow__index--${step.tone ?? 'neutral'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="zh-lab-runtime-flow__copy">
              <strong>{step.label}</strong>
              <Typography.Text type="secondary">{step.detail}</Typography.Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
