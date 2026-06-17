import React, { useState, useMemo } from 'react';
import { Play } from 'lucide-react';
import { Row, Col, Typography, Space, Input, Select, Badge } from 'antd';
import { LabelTag, PanelCard, UiButton } from '../ui';
import { riskLabel } from '../../utils';
import type { AttackEffectivenessCase } from '../../types';

export function ReportDefenseEvidenceBoard({
  cases,
  onOpenScenario
}: {
  cases: AttackEffectivenessCase[];
  onOpenScenario: (id: string) => void;
}) {
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
      const searchable =
        `${item.scenario_id} ${item.surface_name} ${item.title} ${item.target} ${item.observed_decisions.map((decision) => `${decision.policy_id} ${decision.decision}`).join(' ')}`.toLowerCase();
      return matchesSurface && matchesEvidence && (!keyword || searchable.includes(keyword));
    });
  }, [cases, evidenceFilter, query, surfaceFilter]);
  const sortedCases = [...filteredCases].sort((a, b) => {
    const aScore = Math.max(...a.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    const bScore = Math.max(...b.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    return bScore - aScore || a.scenario_id.localeCompare(b.scenario_id);
  });
  const completeCount = cases.filter((item) => item.evidence_complete).length;
  const hashValidCount = cases.filter(
    (item) => item.guarded_hash_status?.valid && item.unguarded_hash_status?.valid
  ).length;

  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div className="zh-defense-evidence-head">
        <div>
          <Typography.Title level={4} className="zh-defense-evidence-title">
            答辩证据视图
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="zh-defense-evidence-subtitle">
            每张证据卡都来自真实运行记录，用于说明攻击可复现、防护可控制、审计可校验。
          </Typography.Paragraph>
        </div>
        <Space size="large">
          <div>
            <Typography.Text type="secondary" className="zh-meta-block">
              证据完整
            </Typography.Text>
            <Typography.Text strong>
              {completeCount}/{cases.length}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary" className="zh-meta-block">
              hash 有效
            </Typography.Text>
            <Typography.Text strong>
              {hashValidCount}/{cases.length}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary" className="zh-meta-block">
              当前显示
            </Typography.Text>
            <Typography.Text strong>{sortedCases.length}</Typography.Text>
          </div>
        </Space>
      </div>

      <Space wrap className="zh-defense-evidence-filters">
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" className="zh-filter-label">
            搜索
          </Typography.Text>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="剧本、策略、工具"
            className="zh-filter-input-md"
          />
        </Space>
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" className="zh-filter-label">
            攻击面
          </Typography.Text>
          <Select value={surfaceFilter} onChange={setSurfaceFilter} className="zh-filter-select-lg">
            <Select.Option value="全部">全部</Select.Option>
            {surfaces.map((surface) => (
              <Select.Option key={surface} value={surface}>
                {surface}
              </Select.Option>
            ))}
          </Select>
        </Space>
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary" className="zh-filter-label">
            证据状态
          </Typography.Text>
          <Select value={evidenceFilter} onChange={setEvidenceFilter} className="zh-filter-select-sm">
            <Select.Option value="全部">全部</Select.Option>
            <Select.Option value="高风险">高风险</Select.Option>
            <Select.Option value="已控制">已控制</Select.Option>
            <Select.Option value="缺证据">缺证据</Select.Option>
            <Select.Option value="hash待验">hash待验</Select.Option>
          </Select>
        </Space>
        <UiButton
          className="zh-defense-evidence-reset"
          onClick={() => {
            setQuery('');
            setSurfaceFilter('全部');
            setEvidenceFilter('全部');
          }}
        >
          清空筛选
        </UiButton>
      </Space>

      <Space orientation="vertical" className="zh-defense-evidence-list" size="large">
        {sortedCases.length ? (
          sortedCases.map((item) => {
            const observed = item.observed_decisions[0];
            const withoutHash = item.without_guard?.audit_hashes?.[0] ?? '';
            const withHash = item.with_guard?.audit_hashes?.[0] ?? '';
            return (
              <PanelCard key={item.scenario_id} type="inner" styles={{ body: { padding: 16 } }}>
                <Row gutter={[24, 24]} align="top">
                  <Col xs={24} md={8}>
                    <Space orientation="vertical" className="zh-defense-evidence-case-stack">
                      <div>
                        <Typography.Text strong className="zh-defense-evidence-case-id">
                          {item.scenario_id}
                        </Typography.Text>
                        <LabelTag color={['critical', 'high'].includes(item.severity) ? 'error' : 'warning'}>
                          {item.surface_name} · {riskLabel[item.severity]}
                        </LabelTag>
                      </div>
                      <Typography.Paragraph className="zh-zero-margin">{item.title}</Typography.Paragraph>
                      <UiButton
                        size="small"
                        type="primary"
                        ghost
                        icon={<Play size={14} />}
                        onClick={() => onOpenScenario(item.scenario_id)}
                      >
                        实验室复现
                      </UiButton>
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
                      <Col span={2} className="zh-defense-evidence-arrow-col">
                        <Typography.Text type="secondary" className="zh-defense-evidence-arrow">
                          →
                        </Typography.Text>
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
                <div className="zh-defense-evidence-summary">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        预期策略
                      </Typography.Text>
                      <Typography.Text strong>
                        {item.expected_decisions.map((decision) => decision.policy_id).join(' / ') || '未记录'}
                      </Typography.Text>
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        实际策略
                      </Typography.Text>
                      <Typography.Text strong>
                        {item.observed_decisions.map((decision) => decision.policy_id ?? '未记录').join(' / ') ||
                          '未记录'}
                      </Typography.Text>
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        匹配
                      </Typography.Text>
                      <Badge
                        status={item.expected_decision_match ? 'success' : 'warning'}
                        text={item.expected_decision_match ? '一致' : '待复核'}
                      />
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        证据
                      </Typography.Text>
                      <Badge
                        status={item.evidence_complete ? 'success' : 'error'}
                        text={item.evidence_complete ? '完整' : '有缺口'}
                      />
                    </Col>
                  </Row>
                </div>
                {item.observed_decisions.length > 1 && (
                  <div className="zh-defense-evidence-steps">
                    <Typography.Text strong className="zh-defense-evidence-step-title">
                      执行步骤
                    </Typography.Text>
                    <Space orientation="vertical" className="zh-full-width">
                      {item.observed_decisions.map((decision, index) => (
                        <div key={`${item.scenario_id}-${index}`} className="zh-defense-evidence-step-row">
                          <LabelTag color="default">{index + 1}</LabelTag>
                          <Typography.Text code>{decision.tool ?? '未知工具'}</Typography.Text>
                          <Typography.Text type="secondary" className="zh-defense-evidence-step-text">
                            {decision.decision ?? '未记录'} / {decision.policy_id ?? '未记录'} · 风险{' '}
                            {decision.risk_score ?? '-'} · 异常 {decision.anomaly_score ?? '-'}
                          </Typography.Text>
                        </div>
                      ))}
                    </Space>
                  </div>
                )}
                <div className="zh-defense-evidence-gap">
                  <Typography.Text
                    type={item.evidence_gaps.length ? 'danger' : 'success'}
                    className="zh-defense-evidence-gap-text"
                  >
                    {item.evidence_gaps.length ? item.evidence_gaps.join('；') : '无证据缺口，可用于答辩复核。'}
                  </Typography.Text>
                </div>
              </PanelCard>
            );
          })
        ) : (
          <Typography.Text type="secondary" className="zh-defense-evidence-empty">
            没有匹配的证据卡，清空筛选后可查看全部剧本。
          </Typography.Text>
        )}
      </Space>
    </PanelCard>
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
        <Col span={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            决策
          </Typography.Text>
          <Typography.Text strong>{decision}</Typography.Text>
        </Col>
        <Col span={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            策略
          </Typography.Text>
          <Typography.Text strong>{policy}</Typography.Text>
        </Col>
        <Col span={12}>
          <Typography.Text type="secondary" className="zh-meta-block">
            风险
          </Typography.Text>
          <Typography.Text strong>{risk ?? '-'}</Typography.Text>
        </Col>
        <Col span={12}>
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
          <Badge
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
