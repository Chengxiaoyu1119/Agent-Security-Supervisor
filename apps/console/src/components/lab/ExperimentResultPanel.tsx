import { Col, Row, Space, Typography } from 'antd';
import type { BatchCompareResult, CompareResult, RunResult } from '@/types';
import { RunAuditTimeline, RunEvidenceStrip } from '../evidence/RunEvidence';
import { MetricCard as Metric, PanelCard } from '../ui';
import { BatchResultPanel } from './BatchResultPanel';
import { ComparisonPanel } from './ComparisonPanel';

interface ExperimentResultPanelProps {
  result: RunResult | null;
  compareResult: CompareResult | null;
  batchResult: BatchCompareResult | null;
}

export function ExperimentResultPanel({ result, compareResult, batchResult }: ExperimentResultPanelProps) {
  return (
    <PanelCard
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>实验结果</Typography.Text>
          <Typography.Text type="secondary" className="zh-text-meta">
            {result ? '已生成' : '等待运行'}
          </Typography.Text>
        </Space>
      }
      variant="borderless"
      className="zh-lab-result-card"
    >
      {result ? (
        <Space orientation="vertical" size="large" className="zh-full-width">
          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} sm={12} lg={8}>
              <Metric
                label="攻击成功"
                value={result.attack_success ? '是' : '否'}
                tone={result.attack_success ? 'red' : 'green'}
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Metric label="阻断" value={`${result.metrics.blocked_count}`} tone="red" />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Metric label="询问" value={`${result.metrics.asked_count}`} tone="amber" />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Metric label="隔离" value={`${result.metrics.isolated_count}`} tone="cyan" />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Metric label="检测延迟" value={`${result.metrics.detection_latency_ms}ms`} tone="green" />
            </Col>
          </Row>

          <RunEvidenceStrip title="当前运行证据" run={result} />
          <RunAuditTimeline title="当前运行全链路审计" logs={result.audit_logs} />

          {compareResult && <ComparisonPanel comparison={compareResult} />}
          {batchResult && <BatchResultPanel batch={batchResult} />}
        </Space>
      ) : (
        <div className="zh-result-empty">
          <Typography.Text type="secondary">暂无实验结果。请点击左侧运行按钮开始测试。</Typography.Text>
        </div>
      )}
    </PanelCard>
  );
}
