import { Col, Row, Space, Typography } from 'antd';
import type { TargetLabState } from '../../types';
import { MetricCard, PanelCard, UiButton } from '../ui';

type TargetLabStatePanelProps = {
  targetLab: TargetLabState | null;
  onReset: () => void;
};

export function TargetLabStatePanel({ targetLab, onReset }: TargetLabStatePanelProps) {
  return (
    <Row gutter={[20, 20]} className="zh-attack-lab__evidence-row">
      <Col xs={24}>
        <PanelCard title="本地靶场状态" subtitle={targetLab ? targetLab.state_path : '未加载'}>
          <Row gutter={[12, 12]} className="zh-mb-16">
            <Col xs={12} md={6}>
              <MetricCard label="API 调用" value={targetLab?.api_call_count ?? '-'} tone="cyan" />
            </Col>
            <Col xs={12} md={6}>
              <MetricCard label="批量导出" value={targetLab?.bulk_export_count ?? '-'} tone="amber" />
            </Col>
            <Col xs={12} md={6}>
              <MetricCard label="敏感读取" value={targetLab?.sensitive_read_count ?? '-'} tone="red" />
            </Col>
            <Col xs={12} md={6}>
              <MetricCard label="复盘备注" value={targetLab?.review_note_count ?? '-'} tone="green" />
            </Col>
          </Row>
          <Space>
            <UiButton onClick={onReset}>重置本地靶场</UiButton>
            <Typography.Text type="secondary">所有变化只写入本地沙箱文件，不访问真实比赛平台。</Typography.Text>
          </Space>
        </PanelCard>
      </Col>
    </Row>
  );
}
