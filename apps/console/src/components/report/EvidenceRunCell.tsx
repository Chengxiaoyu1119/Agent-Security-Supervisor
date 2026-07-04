import { Col, Row, Typography } from 'antd';
import { UiBadge } from '../ui';

export function EvidenceRunCell({
  title,
  state,
  tone,
  decision,
  policy,
  risk,
  anomaly,
  hash,
  hashValid
}: {
  title: string;
  state: string;
  tone: 'danger' | 'safe' | 'muted';
  decision: string;
  policy: string;
  risk?: number;
  anomaly?: number;
  hash?: string;
  hashValid?: boolean;
}) {
  const toneClass = `zh-evidence-run-cell--${tone}`;
  const stateClass = tone === 'muted' ? '' : `zh-evidence-run-cell__state--${tone}`;

  return (
    <div className={`zh-evidence-run-cell ${toneClass}`}>
      <div className="zh-evidence-run-cell__head">
        <Typography.Text type="secondary" className="zh-evidence-run-cell__title">
          {title}
        </Typography.Text>
        <Typography.Text strong className={stateClass}>
          {state}
        </Typography.Text>
      </div>
      <Row gutter={[8, 8]} className="zh-evidence-run-cell__metrics">
        <Col xs={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            决策
          </Typography.Text>
          <Typography.Text strong>{decision}</Typography.Text>
        </Col>
        <Col xs={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            策略
          </Typography.Text>
          <Typography.Text strong>{policy}</Typography.Text>
        </Col>
        <Col xs={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            风险
          </Typography.Text>
          <Typography.Text strong>{risk ?? '-'}</Typography.Text>
        </Col>
        <Col xs={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            异常
          </Typography.Text>
          <Typography.Text strong>{anomaly ?? '-'}</Typography.Text>
        </Col>
      </Row>
      <div className="zh-evidence-run-cell__hash">
        <Typography.Text type="secondary" className="zh-evidence-run-cell__hash-text">
          {hash ? hash.slice(0, 16) : '暂无 hash'}
        </Typography.Text>
        {hash && (
          <UiBadge
            status={hashValid ? 'success' : 'warning'}
            text={
              <Typography.Text type="secondary" className="zh-evidence-run-cell__hash-status">
                {hashValid ? '有效' : '待验'}
              </Typography.Text>
            }
          />
        )}
      </div>
    </div>
  );
}
