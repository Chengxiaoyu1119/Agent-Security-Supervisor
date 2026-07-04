import { Col, Descriptions, Row, Typography } from 'antd';
import type { TargetLabState } from '../../types';
import { EvidenceCodeBlock, MetricCard, PanelCard, UiButton } from '../ui';

type TargetLabStatePanelProps = {
  targetLab: TargetLabState | null;
  onReset: () => void;
};

export function TargetLabStatePanel({ targetLab, onReset }: TargetLabStatePanelProps) {
  return (
    <Row gutter={[20, 20]} className="zh-attack-lab__evidence-row">
      <Col xs={24}>
        <PanelCard
          title="靶场变化区"
          subtitle={<span className="zh-lab-path-text">{targetLab ? targetLab.state_path : '尚未加载'}</span>}
        >
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

          <Descriptions column={{ xs: 1, md: 2 }} size="small" className="zh-mb-16">
            <Descriptions.Item label="队伍数据">{targetLab?.team_count ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="提交物">{targetLab?.submission_count ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{targetLab?.updated_at ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="状态文件">
              <span className="zh-lab-path-text">{targetLab?.state_path ?? '-'}</span>
            </Descriptions.Item>
          </Descriptions>

          {targetLab?.latest_api_call && (
            <div className="zh-attack-lab__field zh-mb-16">
              <Typography.Text strong>最近一次靶场 API 调用</Typography.Text>
              <EvidenceCodeBlock maxHeight="small">
                {JSON.stringify(targetLab.latest_api_call, null, 2)}
              </EvidenceCodeBlock>
            </div>
          )}

          <div className="zh-lab-state-actions">
            <UiButton onClick={onReset}>重置本地靶场</UiButton>
            <Typography.Text type="secondary" className="zh-lab-state-actions__note">
              所有变化只写入本地沙箱文件，不访问真实比赛平台，也不会发送真实邮件。
            </Typography.Text>
          </div>
        </PanelCard>
      </Col>
    </Row>
  );
}
