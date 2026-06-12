import { Row, Col, Card, Typography, Select, Switch, Button, Space, Descriptions, Table, Tag } from 'antd';
import { ClipboardList, Play, TerminalSquare } from 'lucide-react';
import type { BatchCompareResult, CompareResult, RunResult, Scenario } from '../../types';
import { RunAuditTimeline, RunEvidenceStrip } from '../evidence/RunEvidence';
import { DecisionPill, MetricCard as Metric } from '../ui';

export function ExperimentLab(props: {
  scenario: Scenario;
  scenarios: Scenario[];
  selected: string;
  setSelected: (id: string) => void;
  guardEnabled: boolean;
  setGuardEnabled: (value: boolean) => void;
  running: boolean;
  run: () => void;
  compare: () => void;
  batchCompare: () => void;
  result: RunResult | null;
  compareResult: CompareResult | null;
  batchResult: BatchCompareResult | null;
}) {
  return (
    <Row gutter={[24, 24]} align="stretch">
      <Col xs={24} lg={8}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card 
            title={<Space orientation="vertical" size={0}><Typography.Text strong>攻击剧本控制</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{props.scenario.id}</Typography.Text></Space>} 
            variant="borderless"
          >
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>选择剧本</Typography.Text>
              <Select
                value={props.selected}
                onChange={props.setSelected}
                style={{ width: '100%' }}
                options={props.scenarios.map(s => ({ label: `${s.id} - ${s.title}`, value: s.id }))}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '12px 16px', background: 'var(--ant-color-fill-quaternary)', borderRadius: 8 }}>
              <Typography.Text strong>行为监督器</Typography.Text>
              <Switch checked={props.guardEnabled} onChange={props.setGuardEnabled} checkedChildren="开启" unCheckedChildren="关闭" />
            </div>

            <Space orientation="vertical" style={{ width: '100%', marginBottom: 24 }}>
              <Button type="primary" block icon={<Play size={16} />} onClick={props.run} loading={props.running}>
                {props.running ? '运行中...' : '运行当前剧本'}
              </Button>
              <Button block icon={<TerminalSquare size={16} />} onClick={props.compare} disabled={props.running}>
                无防护/有防护对比
              </Button>
              <Button block icon={<ClipboardList size={16} />} onClick={props.batchCompare} disabled={props.running}>
                批量对比全部剧本
              </Button>
            </Space>

            <Card type="inner" title="智能体攻击脚本步骤" size="small">
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {props.scenario.script_steps.map((step) => <li key={step}><Typography.Text>{step}</Typography.Text></li>)}
              </ol>
            </Card>
          </Card>

          <Card 
            title={<Space orientation="vertical" size={0}><Typography.Text strong>攻击样本与越狱用例</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{props.scenario.target}</Typography.Text></Space>} 
            variant="borderless"
          >
            <Descriptions column={1} layout="vertical" size="small" bordered>
              <Descriptions.Item label="模型对抗样本">{props.scenario.adversarial_prompt}</Descriptions.Item>
              <Descriptions.Item label="越狱测试用例">{props.scenario.jailbreak_case}</Descriptions.Item>
              <Descriptions.Item label="防御策略">{props.scenario.defense}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Col>

      <Col xs={24} lg={16}>
        <Card 
          title={<Space orientation="vertical" size={0}><Typography.Text strong>实验结果</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{props.result ? '已生成' : '等待运行'}</Typography.Text></Space>} 
          variant="borderless"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column'  }}}
        >
          {props.result ? (
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col span={8}><Metric label="攻击成功" value={props.result.attack_success ? '是' : '否'} tone={props.result.attack_success ? 'red' : 'green'} /></Col>
                <Col span={4}><Metric label="阻断" value={`${props.result.metrics.blocked_count}`} tone="red" /></Col>
                <Col span={4}><Metric label="询问" value={`${props.result.metrics.asked_count}`} tone="amber" /></Col>
                <Col span={4}><Metric label="隔离" value={`${props.result.metrics.isolated_count}`} tone="cyan" /></Col>
                <Col span={4}><Metric label="检测延迟" value={`${props.result.metrics.detection_latency_ms}ms`} tone="green" /></Col>
              </Row>
              
              <RunEvidenceStrip title="当前运行证据" run={props.result} />
              <RunAuditTimeline title="当前运行全链路审计" logs={props.result.audit_logs} />
              
              {props.compareResult && <ComparisonPanel comparison={props.compareResult} />}
              {props.batchResult && <BatchResultPanel batch={props.batchResult} />}
            </Space>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ant-color-text-description)', padding: 64 }}>
              <Typography.Text type="secondary">暂无实验结果。请点击左侧运行按钮开始测试。</Typography.Text>
            </div>
          )}
        </Card>
      </Col>
    </Row>  );
}

function ComparisonPanel({ comparison }: { comparison: CompareResult }) {
  const before = comparison.without_guard;
  const after = comparison.with_guard;
  return (
    <Card type="inner" title="对比结果分析" style={{ marginTop: 24 }}>
      <Row gutter={24} align="middle">
        <Col span={11}>
          <Card variant="borderless" style={{ background: 'var(--ant-color-error-bg)' }}>
            <Typography.Text type="secondary" style={{ display: 'block' }}>无防护复现</Typography.Text>
            <Typography.Title level={4} style={{ color: 'var(--ant-color-error)', marginTop: 8 }}>{before.attack_success ? '攻击成功' : '未达成风险'}</Typography.Title>
            <Typography.Paragraph style={{ fontSize: 13 }}>监督器只记录不阻断，模拟真实攻击风险暴露。</Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>延迟 {before.metrics.detection_latency_ms}ms · 阻断 {before.metrics.blocked_count}</Typography.Text>
          </Card>
        </Col>
        <Col span={2} style={{ textAlign: 'center' }}>
          <Typography.Title level={3} type="secondary" style={{ margin: 0 }}>→</Typography.Title>
        </Col>
        <Col span={11}>
          <Card variant="borderless" style={{ background: 'var(--ant-color-success-bg)' }}>
            <Typography.Text type="secondary" style={{ display: 'block' }}>有防护验证</Typography.Text>
            <Typography.Title level={4} style={{ color: 'var(--ant-color-success)', marginTop: 8 }}>{after.attack_success ? '仍需加固' : '风险已控制'}</Typography.Title>
            <Typography.Paragraph style={{ fontSize: 13 }}>行为监督器输出拒绝、询问或隔离，形成可解释防御证据。</Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>延迟 {after.metrics.detection_latency_ms}ms · 阻断 {after.metrics.blocked_count} · 询问 {after.metrics.asked_count} · 隔离 {after.metrics.isolated_count}</Typography.Text>
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={12}><RunEvidenceStrip title="无防护证据" run={before} compact /></Col>
          <Col span={12}><RunEvidenceStrip title="有防护证据" run={after} compact /></Col>
        </Row>
      </div>
      <div style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={12}><RunAuditTimeline title="无防护全链路审计" logs={before.audit_logs} compact /></Col>
          <Col span={12}><RunAuditTimeline title="有防护全链路审计" logs={after.audit_logs} compact /></Col>
        </Row>
      </div>
    </Card>
  );}

function BatchResultPanel({ batch }: { batch: BatchCompareResult }) {
  const columns = [
    { title: '剧本', dataIndex: 'scenario_id', key: 'scenario_id', render: (text: string) => <Typography.Text strong>{text}</Typography.Text> },
    { title: '无防护', key: 'without_guard', render: (_: any, record: any) => <Tag color={record.without_guard.attack_success ? 'error' : 'default'}>{record.without_guard.attack_success ? '暴露' : '未暴露'}</Tag> },
    { title: '有防护', key: 'with_guard', render: (_: any, record: any) => <Tag color={record.with_guard.attack_success ? 'error' : 'success'}>{record.with_guard.attack_success ? '仍成功' : '已控制'}</Tag> },
    { title: '监督决策', key: 'decision', render: (_: any, record: any) => { const dec = record.with_guard.audit_logs[0]?.decision ?? '未记录'; return <DecisionPill decision={dec} />; } },
    { title: '延迟', key: 'latency', render: (_: any, record: any) => <Typography.Text>{record.with_guard.metrics.detection_latency_ms}ms</Typography.Text> }
  ];

  return (
    <Card type="inner" title={<Space orientation="vertical" size={0}><Typography.Text strong>批量对比结果</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{batch.summary.total} 个剧本 · 控制率 {batch.summary.control_rate}%</Typography.Text></Space>} style={{ marginTop: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Metric label="无防护暴露" value={`${batch.summary.exposed_without_guard}`} tone="red" /></Col>
        <Col span={6}><Metric label="有防护控制" value={`${batch.summary.controlled_with_guard}`} tone="green" /></Col>
        <Col span={6}><Metric label="攻击下降" value={`${batch.summary.attack_success_reduced}`} tone="cyan" /></Col>
        <Col span={6}><Metric label="平均延迟" value={`${batch.summary.avg_latency_ms}ms`} tone="amber" /></Col>
      </Row>
      <Table 
        dataSource={batch.comparisons} 
        columns={columns} 
        rowKey="scenario_id" 
        pagination={false} 
        size="small"
        bordered
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 16, fontSize: 13 }}>
        * 批量运行会写入实验日志，评测报告页会自动统计这些运行记录，适合答辩时一键展示整体防护效果。
      </Typography.Paragraph>
    </Card>
  );
}
