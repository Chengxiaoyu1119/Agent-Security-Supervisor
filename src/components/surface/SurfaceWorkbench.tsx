import { ClipboardList, Play, ScrollText } from 'lucide-react';
import type { AttackSurface, Scenario, SurfaceEvidencePack } from '../../types';
import { riskLabel } from '../../utils';
import { EvidenceList, MetaGrid, MetricCard as Metric, PanelCard } from '../ui';
import { Typography, Tag, Space, Button, Row, Col, Divider } from 'antd';
import { SurfaceAttributeGroup } from './SurfaceAttributeGroup';

const coverageLabel: Record<string, string> = {
  has_surface_profile: '攻击面画像',
  has_adversarial_samples: '对抗样本',
  has_jailbreak_cases: '越狱用例',
  has_agent_scripts: '攻击脚本',
  has_policy_expectations: '策略预期',
  has_runtime_evidence: '运行证据'
};

type SurfaceEvidenceScenario = SurfaceEvidencePack['scenarios'][number];

export function SurfaceCard({
  surface,
  scenarioCount,
  selected,
  onSelect
}: {
  surface: AttackSurface;
  scenarioCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const entries = surface.entry_points?.slice(0, 2) ?? [];
  const signals = surface.detection_signals?.slice(0, 2) ?? [];
  let color = 'default';
  if (surface.risk === 'critical') color = 'error';
  if (surface.risk === 'high') color = 'warning';
  if (surface.risk === 'medium') color = 'processing';

  return (
    <PanelCard
      type="inner"
      hoverable
      onClick={onSelect}
      className={`zh-surface-card${selected ? ' zh-surface-card--selected' : ''}`}
      styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 16 } }}
    >
      <div className="zh-surface-card__head">
        <Typography.Text strong className="zh-text-lg">
          {surface.name}
        </Typography.Text>
        <Tag color={color}>{riskLabel[surface.risk]}</Tag>
      </div>
      <Typography.Paragraph type="secondary" className="zh-surface-card__summary">
        {surface.summary}
      </Typography.Paragraph>

      {(entries.length > 0 || signals.length > 0) && (
        <Space size={[0, 4]} wrap className="zh-surface-card__tags">
          {entries.map((item) => (
            <Tag key={`entry-${item}`} variant="filled">
              入口：{item}
            </Tag>
          ))}
          {signals.map((item) => (
            <Tag key={`signal-${item}`} variant="filled" color="processing">
              信号：{item}
            </Tag>
          ))}
        </Space>
      )}

      <Row gutter={[8, 8]} className="zh-surface-card__meta">
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            样本
          </Typography.Text>
          <Typography.Text strong>{surface.samples}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            脚本
          </Typography.Text>
          <Typography.Text strong>{surface.scripts}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            剧本
          </Typography.Text>
          <Typography.Text strong>{scenarioCount}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            状态
          </Typography.Text>
          <Typography.Text strong>{surface.status}</Typography.Text>
        </Col>
      </Row>
    </PanelCard>
  );
}

export function SurfaceWorkbench({
  surface,
  scenarios,
  surfacePack,
  surfacePackLoading,
  surfacePackError,
  running,
  onOpenScenario,
  onBatchCompare
}: {
  surface: AttackSurface;
  scenarios: Scenario[];
  surfacePack: SurfaceEvidencePack | null;
  surfacePackLoading: boolean;
  surfacePackError: string;
  running: boolean;
  onOpenScenario: (id: string) => void;
  onBatchCompare: (ids: string[], label: string) => void;
}) {
  const firstScenarioId = scenarios[0]?.id;
  let color = 'default';
  if (surface.risk === 'critical') color = 'error';
  if (surface.risk === 'high') color = 'warning';
  if (surface.risk === 'medium') color = 'processing';

  return (
    <PanelCard className={`zh-surface-workbench zh-surface-workbench--${color}`} styles={{ body: { padding: 24 } }}>
      <Row gutter={32}>
        <Col xs={24} lg={16}>
          <div className="zh-surface-workbench__head">
            <div>
              <Typography.Title level={3} className="zh-surface-workbench__title">
                {surface.name}
              </Typography.Title>
              <Space size="small" align="center" wrap>
                <Tag color={color}>{riskLabel[surface.risk]}风险</Tag>
                <Typography.Text type="secondary" className="zh-code-sm">
                  {surface.id}
                </Typography.Text>
                <Typography.Text type="secondary" className="zh-text-sm">
                  {surface.status}
                </Typography.Text>
              </Space>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<Play size={16} />}
                onClick={() => firstScenarioId && onOpenScenario(firstScenarioId)}
                disabled={!firstScenarioId}
              >
                运行首个剧本
              </Button>
              <Button
                icon={<ClipboardList size={16} />}
                onClick={() =>
                  onBatchCompare(
                    scenarios.map((scenario) => scenario.id),
                    surface.name
                  )
                }
                disabled={running || !scenarios.length}
              >
                {running ? '验证中...' : '批量验证'}
              </Button>
            </Space>
          </div>

          <Typography.Paragraph type="secondary" className="zh-surface-workbench__summary">
            {surface.summary}
          </Typography.Paragraph>

          <Row gutter={[16, 16]} className="zh-mb-24">
            <Col xs={12} sm={6}>
              <Metric label="样本" value={`${surface.samples}`} tone="cyan" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="脚本" value={`${surface.scripts}`} tone="amber" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="剧本" value={`${scenarios.length}`} tone="green" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric
                label="风险"
                value={riskLabel[surface.risk]}
                tone={surface.risk === 'critical' ? 'red' : surface.risk === 'high' ? 'amber' : 'cyan'}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="zh-surface-workbench__attributes">
            <Col span={12}>
              <SurfaceAttributeGroup title="攻击入口" items={surface.entry_points} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="保护资产" items={surface.protected_assets} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="攻击目标" items={surface.attacker_goals} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="检测信号" items={surface.detection_signals} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="评测重点" items={surface.evaluation_focus} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup
                title="防御加固"
                items={surface.mitigations?.length ? surface.mitigations : [surface.defense]}
              />
            </Col>
          </Row>

          <SurfaceDefenseBriefCard
            surface={surface}
            scenarios={scenarios}
            pack={surfacePack}
            loading={surfacePackLoading}
          />
          <Divider />
          <SurfaceEvidencePackPanel
            surface={surface}
            pack={surfacePack}
            loading={surfacePackLoading}
            error={surfacePackError}
          />
        </Col>

        <Col xs={24} lg={8}>
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
            styles={{ body: { padding: 0 } }}
          >
            <div className="zh-column-stack">
              {scenarios.map((scenario) => {
                const scenarioToneClass = ['critical', 'high'].includes(scenario.severity)
                  ? ` zh-surface-scenario-dot--${scenario.severity}`
                  : '';
                return (
                  <div
                    key={scenario.id}
                    onClick={() => onOpenScenario(scenario.id)}
                    className="zh-surface-scenario-item"
                  >
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
        </Col>
      </Row>
    </PanelCard>
  );
}

function SurfaceDefenseBriefCard({
  surface,
  scenarios,
  pack,
  loading
}: {
  surface: AttackSurface;
  scenarios: Scenario[];
  pack: SurfaceEvidencePack | null;
  loading: boolean;
}) {
  const markdownHref = `/api/attack_surfaces/${encodeURIComponent(surface.id)}/evidence_pack.md`;
  const briefingSheetHref = `/api/attack_surfaces/${encodeURIComponent(surface.id)}/briefing_sheet.html`;
  const summary = pack?.summary;
  const mainScenario = pack?.scenarios[0];
  const fallbackScenario = scenarios[0];
  const displayValue = (value: number | string) => (loading && !pack ? '...' : value);
  const threatNodes = (
    pack?.threat_chain?.length
      ? pack.threat_chain
      : [
          { stage: '攻击入口', text: surface.entry_points?.[0] ?? '待补充' },
          { stage: '目标资产', text: surface.protected_assets?.[0] ?? '待补充' },
          { stage: '监督策略', text: surface.defense }
        ]
  ).slice(0, 4);
  const coverageEntries = Object.entries(
    pack?.coverage_checks ?? {
      has_surface_profile: Boolean(surface.entry_points?.length && surface.protected_assets?.length),
      has_adversarial_samples: surface.samples > 0,
      has_jailbreak_cases: surface.samples > 0,
      has_agent_scripts: surface.scripts > 0,
      has_policy_expectations: false,
      has_runtime_evidence: false
    }
  );
  const policyItems = pack?.policy_distribution.slice(0, 4) ?? [];
  const toolItems = pack?.tool_coverage.slice(0, 4) ?? [];
  const latestGuarded = mainScenario?.latest_guarded_result;
  const decisionTone =
    latestGuarded?.status === '已控制' ? 'success' : latestGuarded?.status === '攻击成功' ? 'error' : 'processing';

  return (
    <PanelCard type="inner" className="zh-mb-24" styles={{ body: { padding: 24 } }}>
      <div className="zh-surface-brief__head">
        <div>
          <Typography.Text type="secondary" className="zh-surface-matrix-label">
            答辩单页
          </Typography.Text>
          <Typography.Title level={4} className="zh-zero-margin">
            {surface.name}
          </Typography.Title>
        </div>
        <div className="zh-surface-brief__score">
          <Typography.Title level={2} className="zh-surface-brief__score-value">
            {displayValue(`${summary?.readiness_score ?? 0}%`)}
          </Typography.Title>
          <Typography.Text type="secondary" className="zh-text-sm">
            证据完整度
          </Typography.Text>
        </div>
      </div>

      <Row gutter={[16, 16]} className="zh-surface-brief__stats">
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            剧本
          </Typography.Text>
          <Typography.Text strong>{displayValue(summary?.scenario_count ?? scenarios.length)}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            样本/脚本
          </Typography.Text>
          <Typography.Text strong>
            {displayValue(
              `${summary?.sample_count ?? surface.samples}/${summary?.agent_script_count ?? surface.scripts}`
            )}
          </Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            控制率
          </Typography.Text>
          <Typography.Text strong>{displayValue(`${summary?.control_rate ?? 0}%`)}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            缺口
          </Typography.Text>
          <Typography.Text strong>{displayValue(summary?.gap_count ?? 0)}</Typography.Text>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
          <Typography.Text strong className="zh-surface-section-title">
            攻击链路
          </Typography.Text>
          <Space orientation="vertical" className="zh-surface-threat-list">
            {threatNodes.map((node, index) => (
              <div key={`${node.stage}-${index}`} className="zh-surface-threat-row">
                <div className="zh-surface-threat-index">{index + 1}</div>
                <div>
                  <Typography.Text type="secondary" className="zh-meta-block">
                    {node.stage}
                  </Typography.Text>
                  <Typography.Text strong className="zh-text-md">
                    {node.text}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </Space>
        </Col>

        <Col span={8}>
          <Typography.Text strong className="zh-surface-section-title">
            监督命中
          </Typography.Text>
          <div className="zh-surface-subsection">
            <Space>
              <Tag color={decisionTone}>{latestGuarded?.status ?? '待验证'}</Tag>
              <Typography.Text type="secondary" className="zh-text-sm">
                {mainScenario?.id ?? fallbackScenario?.id ?? '暂无剧本'}
              </Typography.Text>
            </Space>
          </div>
          <Typography.Text type="secondary" className="zh-surface-matrix-label">
            命中策略
          </Typography.Text>
          <Space size={[0, 8]} wrap className="zh-surface-subsection">
            {policyItems.length ? (
              policyItems.map((item) => (
                <Tag key={item.policy_id} color="processing">
                  {item.policy_id}
                </Tag>
              ))
            ) : (
              <Typography.Text type="secondary" className="zh-text-sm">
                加载中
              </Typography.Text>
            )}
          </Space>
          <Typography.Text type="secondary" className="zh-surface-matrix-label">
            覆盖工具
          </Typography.Text>
          <Space size={[0, 8]} wrap>
            {toolItems.length ? (
              toolItems.map((item) => <Tag key={item.tool}>{item.tool}</Tag>)
            ) : (
              <Typography.Text type="secondary" className="zh-text-sm">
                加载中
              </Typography.Text>
            )}
          </Space>
        </Col>

        <Col span={8}>
          <Typography.Text strong className="zh-surface-section-title">
            验收闭环{' '}
            <Typography.Text type="secondary">
              ({coverageEntries.filter(([, checked]) => checked).length}/{coverageEntries.length})
            </Typography.Text>
          </Typography.Text>
          <Space orientation="vertical" size={4} className="zh-surface-coverage-list">
            {coverageEntries.map(([key, checked]) => (
              <div key={key} className="zh-surface-coverage-row">
                <div className={`zh-surface-coverage-dot${checked ? ' zh-surface-coverage-dot--checked' : ''}`} />
                <Typography.Text
                  type={checked ? undefined : 'secondary'}
                  className={`zh-surface-coverage-text${checked ? ' zh-surface-coverage-text--checked' : ''}`}
                >
                  {coverageLabel[key] ?? key}
                </Typography.Text>
              </div>
            ))}
          </Space>
          <Space orientation="vertical" className="zh-full-width">
            <Button block href={briefingSheetHref} target="_blank" icon={<ScrollText size={14} />}>
              打开独立单页
            </Button>
            <Button block type="dashed" href={markdownHref} target="_blank" icon={<ScrollText size={14} />}>
              Markdown
            </Button>
          </Space>
        </Col>
      </Row>
    </PanelCard>
  );
}

function SurfaceEvidencePackPanel({
  surface,
  pack,
  loading,
  error
}: {
  surface: AttackSurface;
  pack: SurfaceEvidencePack | null;
  loading: boolean;
  error: string;
}) {
  const jsonHref = `/api/attack_surfaces/${encodeURIComponent(surface.id)}/evidence_pack`;
  const markdownHref = `/api/attack_surfaces/${encodeURIComponent(surface.id)}/evidence_pack.md`;
  const topPolicies = pack?.policy_distribution.slice(0, 5) ?? [];
  const topScenarios = pack?.scenarios.slice(0, 4) ?? [];
  const topGaps = pack?.gaps.slice(0, 3) ?? [];

  return (
    <PanelCard
      type="inner"
      title="攻击面证据包"
      extra={
        <Space>
          <Button type="link" size="small" href={jsonHref} target="_blank" icon={<ClipboardList size={14} />}>
            JSON
          </Button>
          <Button type="link" size="small" href={markdownHref} target="_blank" icon={<ScrollText size={14} />}>
            Markdown
          </Button>
        </Space>
      }
    >
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {!error && (
        <Space orientation="vertical" size="large" className="zh-surface-pack-stack">
          {topGaps.length > 0 && (
            <div>
              <Typography.Text strong className="zh-surface-matrix-label">
                缺口提示 <Tag color="error">{pack?.summary.gap_count ?? 0}</Tag>
              </Typography.Text>
              <EvidenceList
                items={topGaps.map((gap) => ({
                  key: `${gap.title}-${gap.evidence}`,
                  title: gap.title,
                  description: gap.evidence,
                  meta: gap.action,
                  tone: gap.severity === 'high' ? 'danger' : gap.severity === 'medium' ? 'warning' : 'info'
                }))}
              />
            </div>
          )}

          <div>
            <Typography.Text strong className="zh-surface-matrix-label">
              预期命中策略
            </Typography.Text>
            <Space size={[0, 8]} wrap>
              {topPolicies.length ? (
                topPolicies.map((item) => (
                  <Tag key={item.policy_id}>
                    {item.policy_id} ({item.count})
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary" className="zh-text-md">
                  等待证据包加载
                </Typography.Text>
              )}
            </Space>
          </div>

          <div>
            <Typography.Text strong className="zh-surface-matrix-label">
              关联剧本验证
            </Typography.Text>
            <EvidenceList
              emptyText={loading ? '正在生成证据包...' : '暂无证据包数据。'}
              items={topScenarios.map((scenario: SurfaceEvidenceScenario) => {
                const policies = scenario.expected_decisions.map((item) => item.policy_id).join(' / ') || '未记录';
                const guarded = scenario.latest_guarded_result;
                const statusTone =
                  guarded.status === '已控制' ? 'success' : guarded.status === '攻击成功' ? 'error' : 'processing';

                return {
                  key: scenario.id,
                  title: scenario.id,
                  description: scenario.target,
                  tags: [{ label: guarded.status, color: statusTone }],
                  content: (
                    <MetaGrid
                      columns={2}
                      items={[
                        { key: 'policies', label: '预期策略', value: policies },
                        { key: 'target', label: '攻击目标', value: scenario.target }
                      ]}
                    />
                  )
                };
              })}
            />
          </div>
        </Space>
      )}
    </PanelCard>
  );
}
