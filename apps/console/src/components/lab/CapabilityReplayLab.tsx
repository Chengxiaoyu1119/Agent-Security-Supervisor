import { useState } from 'react';
import { CheckCircle2, Play, ShieldAlert, XCircle } from 'lucide-react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { runCapabilityReplay } from '../../api';
import type { CapabilityReplayProbe, CapabilityReplayResult } from '../../types';
import {
  DecisionPill,
  EvidenceCodeBlock,
  LabelTag,
  MetricCard,
  PanelCard,
  UiAlert,
  UiButton,
  UiTable
} from '../ui';

type CapabilityReplayLabProps = {
  refresh?: () => Promise<unknown>;
};

function statusTag(status: CapabilityReplayProbe['status']) {
  if (status === 'passed') return <LabelTag color="success">已复现</LabelTag>;
  if (status === 'failed') return <LabelTag color="error">失败</LabelTag>;
  return <LabelTag color="warning">需复核</LabelTag>;
}

function statusIcon(status: CapabilityReplayProbe['status']) {
  if (status === 'passed') return <CheckCircle2 size={16} />;
  if (status === 'failed') return <XCircle size={16} />;
  return <ShieldAlert size={16} />;
}

export function CapabilityReplayLab({ refresh }: CapabilityReplayLabProps) {
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<CapabilityReplayResult | null>(null);

  async function runReplay() {
    setRunning(true);
    setNotice('');
    try {
      const nextResult = await runCapabilityReplay();
      setResult(nextResult);
      await refresh?.();
    } catch (error) {
      setNotice(`功能复现失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  const columns: ColumnsType<CapabilityReplayProbe> = [
    {
      title: '功能',
      dataIndex: 'name',
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <Space size={6}>
            {statusIcon(record.status)}
            <Typography.Text strong>{record.name}</Typography.Text>
          </Space>
          <Typography.Text type="secondary" className="zh-text-meta">
            {record.goal}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: '复现级别',
      key: 'replay_level',
      render: (_value, record) => <LabelTag color={record.replay_level === '真实可复现' ? 'blue' : 'cyan'}>{record.replay_level}</LabelTag>
    },
    {
      title: '状态',
      key: 'status',
      render: (_value, record) => statusTag(record.status)
    },
    {
      title: '监督决策',
      key: 'decision',
      render: (_value, record) =>
        record.evidence.decision.includes('->') ? (
          <Typography.Text>{record.evidence.decision}</Typography.Text>
        ) : (
          <DecisionPill decision={record.evidence.decision} />
        )
    },
    {
      title: '策略',
      key: 'policy_id',
      render: (_value, record) => <Typography.Text code>{record.evidence.policy_id}</Typography.Text>
    },
    {
      title: '审计',
      key: 'audit_id',
      render: (_value, record) => (
        <Typography.Text copyable={Boolean(record.evidence.audit_id)} className="zh-text-meta">
          {record.evidence.audit_id ?? '边界拒绝'}
        </Typography.Text>
      )
    }
  ];

  return (
    <div className="zh-attack-lab">
      {notice && <UiAlert type="warning" showIcon title={notice} className="zh-mb-24" />}
      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} xl={7}>
          <PanelCard title="一键复现" subtitle="真实调用链证据" className="zh-full-height">
            <Space direction="vertical" size={16} className="zh-full-width">
              <UiAlert
                type="info"
                showIcon
                message="运行后会实际调用后端实验、沙箱工具、监督器和输出过滤器，并把审计证据集中展示。"
              />
              <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={runReplay}>
                一键复现核心功能
              </UiButton>
              {result && (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="生成时间">{result.generated_at}</Descriptions.Item>
                  <Descriptions.Item label="探针总数">{result.summary.probe_count}</Descriptions.Item>
                  <Descriptions.Item label="可复现能力">{result.summary.runnable_count}</Descriptions.Item>
                  <Descriptions.Item label="通过率">{result.summary.pass_rate}%</Descriptions.Item>
                </Descriptions>
              )}
            </Space>
          </PanelCard>
        </Col>

        <Col xs={24} xl={17}>
          <PanelCard title="复现结果" subtitle={result ? `${result.summary.passed_count}/${result.summary.probe_count} 已通过` : '等待运行'}>
            {result ? (
              <Space direction="vertical" size={16} className="zh-full-width">
                <Row gutter={[12, 12]}>
                  <Col xs={12} lg={6}>
                    <MetricCard label="探针数" value={result.summary.probe_count} tone="cyan" />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard label="已复现" value={result.summary.passed_count} tone="green" />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard label="可运行能力" value={result.summary.runnable_count} tone="amber" />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard label="通过率" value={result.summary.pass_rate} suffix="%" tone="green" />
                  </Col>
                </Row>
                <UiTable<CapabilityReplayProbe>
                  dataSource={result.probes}
                  columns={columns}
                  rowKey="id"
                  size="small"
                  bordered
                  pagination={false}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} lg={8}>
                          <Typography.Text strong>请求参数</Typography.Text>
                          <EvidenceCodeBlock size="small" maxHeight="small">
                            {JSON.stringify(record.request_payload, null, 2)}
                          </EvidenceCodeBlock>
                        </Col>
                        <Col xs={24} lg={8}>
                          <Typography.Text strong>监督证据</Typography.Text>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="标题">{record.evidence.evidence_title}</Descriptions.Item>
                            <Descriptions.Item label="原因">{record.evidence.evidence_detail}</Descriptions.Item>
                            <Descriptions.Item label="建议">{record.evidence.recommendation ?? '按边界策略阻断或人工复核。'}</Descriptions.Item>
                            <Descriptions.Item label="工具">{record.evidence.tool ?? 'URL 预检'}</Descriptions.Item>
                            <Descriptions.Item label="风险分">{record.evidence.risk_score ?? 0}</Descriptions.Item>
                          </Descriptions>
                        </Col>
                        <Col xs={24} lg={8}>
                          <Typography.Text strong>工具/模型输出</Typography.Text>
                          <EvidenceCodeBlock size="small" maxHeight="small">
                            {record.evidence.tool_output_excerpt || '无输出正文'}
                          </EvidenceCodeBlock>
                          <Typography.Text type="secondary" className="zh-text-meta">
                            {(record.evidence.context_sources ?? []).join(', ') || '授权边界检查'}
                          </Typography.Text>
                        </Col>
                      </Row>
                    )
                  }}
                />
              </Space>
            ) : (
              <div className="zh-attack-lab__empty">
                <Typography.Text type="secondary">点击运行后，这里会展示每个功能的真实调用结果和审计证据。</Typography.Text>
              </div>
            )}
          </PanelCard>
        </Col>
      </Row>
    </div>
  );
}
