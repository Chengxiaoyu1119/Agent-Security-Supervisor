import React, { useState, useMemo } from 'react';
import { Play } from 'lucide-react';
import { Card, Row, Col, Typography, Space, Input, Select, Button, Tag, Badge, List } from 'antd';
import { riskLabel } from '../../utils';
import type { AttackEffectivenessCase } from '../../types';

export function ReportDefenseEvidenceBoard({ cases, onOpenScenario }: { cases: AttackEffectivenessCase[]; onOpenScenario: (id: string) => void }) {
  const [surfaceFilter, setSurfaceFilter] = useState('全部');
  const [evidenceFilter, setEvidenceFilter] = useState('全部');
  const [query, setQuery] = useState('');
  const surfaces = useMemo(() => Array.from(new Set(cases.map((item) => item.surface_name))).sort(), [cases]);
  const filteredCases = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesSurface = surfaceFilter === '全部' || item.surface_name === surfaceFilter;
      const matchesEvidence =
        evidenceFilter === '全部' ||
        (evidenceFilter === '高风险' && ['critical', 'high'].includes(item.severity)) ||
        (evidenceFilter === '缺证据' && !item.evidence_complete) ||
        (evidenceFilter === 'hash待验' && !(item.guarded_hash_status?.valid && item.unguarded_hash_status?.valid)) ||
        (evidenceFilter === '已控制' && item.defense_effective_with_guard);
      const searchable = `${item.scenario_id} ${item.surface_name} ${item.title} ${item.target} ${item.observed_decisions.map((decision) => `${decision.policy_id} ${decision.decision}`).join(' ')}`.toLowerCase();
      return matchesSurface && matchesEvidence && (!keyword || searchable.includes(keyword));
    });
  }, [cases, evidenceFilter, query, surfaceFilter]);
  const sortedCases = [...filteredCases].sort((a, b) => {
    const aScore = Math.max(...a.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    const bScore = Math.max(...b.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    return bScore - aScore || a.scenario_id.localeCompare(b.scenario_id);
  });
  const completeCount = cases.filter((item) => item.evidence_complete).length;
  const hashValidCount = cases.filter((item) => item.guarded_hash_status?.valid && item.unguarded_hash_status?.valid).length;

  return (
    <Card variant="borderless" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>答辩证据视图</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: 0, marginTop: 4 }}>每张证据卡都来自真实运行记录，用于说明攻击可复现、防护可控制、审计可校验。</Typography.Paragraph>
        </div>
        <Space size="large">
          <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>证据完整</Typography.Text><Typography.Text strong>{completeCount}/{cases.length}</Typography.Text></div>
          <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>hash 有效</Typography.Text><Typography.Text strong>{hashValidCount}/{cases.length}</Typography.Text></div>
          <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>当前显示</Typography.Text><Typography.Text strong>{sortedCases.length}</Typography.Text></div>
        </Space>
      </div>

      <Space wrap style={{ marginBottom: 24, padding: 16, background: 'var(--ant-color-fill-tertiary)', borderRadius: 8, width: '100%' }}>
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>搜索</Typography.Text>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="剧本、策略、工具" style={{ width: 200 }} />
        </Space>
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>攻击面</Typography.Text>
          <Select value={surfaceFilter} onChange={setSurfaceFilter} style={{ width: 150 }}>
            <Select.Option value="全部">全部</Select.Option>
            {surfaces.map((surface) => <Select.Option key={surface} value={surface}>{surface}</Select.Option>)}
          </Select>
        </Space>
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>证据状态</Typography.Text>
          <Select value={evidenceFilter} onChange={setEvidenceFilter} style={{ width: 120 }}>
            <Select.Option value="全部">全部</Select.Option>
            <Select.Option value="高风险">高风险</Select.Option>
            <Select.Option value="已控制">已控制</Select.Option>
            <Select.Option value="缺证据">缺证据</Select.Option>
            <Select.Option value="hash待验">hash待验</Select.Option>
          </Select>
        </Space>
        <Button style={{ marginTop: 20 }} onClick={() => { setQuery(''); setSurfaceFilter('全部'); setEvidenceFilter('全部'); }}>清空筛选</Button>
      </Space>

      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        {sortedCases.length ? sortedCases.map((item) => {
          const observed = item.observed_decisions[0];
          const withoutHash = item.without_guard?.audit_hashes?.[0] ?? '';
          const withHash = item.with_guard?.audit_hashes?.[0] ?? '';
          return (
            <Card key={item.scenario_id} type="inner" styles={{ body: { padding: 16  }}}>
              <Row gutter={[24, 24]} align="top">
                <Col xs={24} md={8}>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 16, marginRight: 8 }}>{item.scenario_id}</Typography.Text>
                      <Tag color={['critical', 'high'].includes(item.severity) ? 'error' : 'warning'}>{item.surface_name} · {riskLabel[item.severity]}</Tag>
                    </div>
                    <Typography.Paragraph style={{ margin: 0 }}>{item.title}</Typography.Paragraph>
                    <Button size="small" type="primary" ghost icon={<Play size={14} />} onClick={() => onOpenScenario(item.scenario_id)}>实验室复现</Button>
                  </Space>
                </Col>
                <Col xs={24} md={16}>
                  <Row gutter={16}>
                    <Col span={11}>
                      <EvidenceRunCell
                        title="无防护复现"
                        state={item.attack_reproduced_without_guard ? '攻击暴露' : '未复现'}
                        tone={item.attack_reproduced_without_guard ? 'danger' : 'muted'}
                        decision={item.without_guard?.decisions?.[0] ?? '未记录'}
                        policy={item.without_guard?.policies?.[0] ?? '未记录'}
                        risk={item.without_guard?.risk_scores?.[0]}
                        anomaly={item.without_guard?.anomaly_scores?.[0]}
                        hash={withoutHash}
                        hashValid={item.unguarded_hash_status?.valid}
                      />
                    </Col>
                    <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography.Text type="secondary" style={{ fontSize: 24 }}>→</Typography.Text>
                    </Col>
                    <Col span={11}>
                      <EvidenceRunCell
                        title="有防护验证"
                        state={item.defense_effective_with_guard ? '风险已控制' : '仍需补强'}
                        tone={item.defense_effective_with_guard ? 'safe' : 'danger'}
                        decision={item.with_guard?.decisions?.[0] ?? observed?.decision ?? '未记录'}
                        policy={item.with_guard?.policies?.[0] ?? observed?.policy_id ?? '未记录'}
                        risk={item.with_guard?.risk_scores?.[0] ?? observed?.risk_score}
                        anomaly={item.with_guard?.anomaly_scores?.[0] ?? observed?.anomaly_score}
                        hash={withHash}
                        hashValid={item.guarded_hash_status?.valid}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--ant-color-fill-quaternary)', borderRadius: 8 }}>
                <Row gutter={16}>
                  <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>预期策略</Typography.Text><Typography.Text strong>{item.expected_decisions.map((decision) => decision.policy_id).join(' / ') || '未记录'}</Typography.Text></Col>
                  <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>实际策略</Typography.Text><Typography.Text strong>{item.observed_decisions.map((decision) => decision.policy_id ?? '未记录').join(' / ') || '未记录'}</Typography.Text></Col>
                  <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>匹配</Typography.Text><Badge status={item.expected_decision_match ? 'success' : 'warning'} text={item.expected_decision_match ? '一致' : '待复核'} /></Col>
                  <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>证据</Typography.Text><Badge status={item.evidence_complete ? 'success' : 'error'} text={item.evidence_complete ? '完整' : '有缺口'} /></Col>
                </Row>
              </div>
              {item.observed_decisions.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  <Typography.Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>执行步骤</Typography.Text>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {item.observed_decisions.map((decision, index) => (
                      <div key={`${item.scenario_id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ant-color-bg-layout)', padding: '8px 12px', borderRadius: 4 }}>
                        <Tag color="default">{index + 1}</Tag>
                        <Typography.Text code>{decision.tool ?? '未知工具'}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>{decision.decision ?? '未记录'} / {decision.policy_id ?? '未记录'} · 风险 {decision.risk_score ?? '-'} · 异常 {decision.anomaly_score ?? '-'}</Typography.Text>
                      </div>
                    ))}
                  </Space>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <Typography.Text type={item.evidence_gaps.length ? 'danger' : 'success'} style={{ fontSize: 13 }}>
                  {item.evidence_gaps.length ? item.evidence_gaps.join('；') : '无证据缺口，可用于答辩复核。'}
                </Typography.Text>
              </div>
            </Card>
          );
        }) : <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 32 }}>没有匹配的证据卡，清空筛选后可查看全部剧本。</Typography.Text>}
      </Space>
    </Card>
  );
}

export function EvidenceRunCell({
  title,
  state,
  tone,
  decision,
  policy,
  risk,
  anomaly,
  hash,
  hashValid,
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
  const bg = tone === 'danger' ? 'var(--ant-color-error-bg)' : tone === 'safe' ? 'var(--ant-color-success-bg)' : 'var(--ant-color-fill-tertiary)';
  const color = tone === 'danger' ? 'var(--ant-color-error)' : tone === 'safe' ? 'var(--ant-color-success)' : 'inherit';
  
  return (
    <div style={{ background: bg, padding: 16, borderRadius: 8, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{title}</Typography.Text>
        <Typography.Text strong style={{ color }}>{state}</Typography.Text>
      </div>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>决策</Typography.Text><Typography.Text strong>{decision}</Typography.Text></Col>
        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>策略</Typography.Text><Typography.Text strong>{policy}</Typography.Text></Col>
        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>风险</Typography.Text><Typography.Text strong>{risk ?? '-'}</Typography.Text></Col>
        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>异常</Typography.Text><Typography.Text strong>{anomaly ?? '-'}</Typography.Text></Col>
      </Row>
      <div style={{ background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{hash ? hash.slice(0, 16) : '暂无 hash'}</Typography.Text>
        {hash && <Badge status={hashValid ? 'success' : 'warning'} text={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{hashValid ? '有效' : '待验'}</Typography.Text>} />}
      </div>
    </div>
  );
}