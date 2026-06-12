import { ClipboardList, Play, ScrollText } from 'lucide-react';
import type { AttackSurface, Scenario, SurfaceEvidencePack } from '../../types';
import { MetricCard as Metric } from '../ui';
import { Card, Typography, Tag, Space, Button, Row, Col, Progress, Divider } from 'antd';
import { SurfaceAttributeGroup } from './SurfaceAttributeGroup';

const riskLabel: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低'
};

const coverageLabel: Record<string, string> = {
  has_surface_profile: '攻击面画像',
  has_adversarial_samples: '对抗样本',
  has_jailbreak_cases: '越狱用例',
  has_agent_scripts: '攻击脚本',
  has_policy_expectations: '策略预期',
  has_runtime_evidence: '运行证据'
};

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
  if(surface.risk === 'critical') color = 'error';
  if(surface.risk === 'high') color = 'warning';
  if(surface.risk === 'medium') color = 'processing';

  return (
    <Card 
      type="inner" 
      hoverable 
      onClick={onSelect}
      style={{ 
        cursor: 'pointer', 
        borderColor: selected ? 'var(--ant-color-primary)' : 'var(--ant-color-border-secondary)',
        borderWidth: selected ? 2 : 1,
        height: '100%'
      }}
      styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 16  }}}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Typography.Text strong style={{ fontSize: 16 }}>{surface.name}</Typography.Text>
        <Tag color={color}>{riskLabel[surface.risk]}</Tag>
      </div>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, flex: 1, marginBottom: 16 }}>{surface.summary}</Typography.Paragraph>
      
      {(entries.length > 0 || signals.length > 0) && (
        <Space size={[0, 4]} wrap style={{ marginBottom: 16 }}>
          {entries.map((item) => <Tag key={`entry-${item}`} variant="filled">入口：{item}</Tag>)}
          {signals.map((item) => <Tag key={`signal-${item}`} variant="filled" color="processing">信号：{item}</Tag>)}
        </Space>
      )}

      <Row gutter={[8, 8]} style={{ borderTop: '1px solid var(--ant-color-border-secondary)', paddingTop: 12, marginTop: 'auto' }}>
        <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>样本</Typography.Text><Typography.Text strong>{surface.samples}</Typography.Text></Col>
        <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>脚本</Typography.Text><Typography.Text strong>{surface.scripts}</Typography.Text></Col>
        <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>剧本</Typography.Text><Typography.Text strong>{scenarioCount}</Typography.Text></Col>
        <Col span={6}><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>状态</Typography.Text><Typography.Text strong>{surface.status}</Typography.Text></Col>
      </Row>
    </Card>  );
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
  if(surface.risk === 'critical') color = 'error';
  if(surface.risk === 'high') color = 'warning';
  if(surface.risk === 'medium') color = 'processing';

  return (
    <Card 
      style={{ marginBottom: 24, borderColor: `var(--ant-color-${color})` }} 
      styles={{ body: { padding: 24  }}}
    >
      <Row gutter={32}>
        <Col xs={24} lg={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0, marginBottom: 8 }}>{surface.name}</Typography.Title>
              <Space size="small" align="center" wrap>
                <Tag color={color}>{riskLabel[surface.risk]}风险</Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{surface.id}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{surface.status}</Typography.Text>
              </Space>
            </div>
            <Space>
              <Button type="primary" icon={<Play size={16} />} onClick={() => firstScenarioId && onOpenScenario(firstScenarioId)} disabled={!firstScenarioId}>
                运行首个剧本
              </Button>
              <Button icon={<ClipboardList size={16} />} onClick={() => onBatchCompare(scenarios.map((scenario) => scenario.id), surface.name)} disabled={running || !scenarios.length}>
                {running ? '验证中...' : '批量验证'}
              </Button>
            </Space>
          </div>
          
          <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 24 }}>{surface.summary}</Typography.Paragraph>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}><Metric label="样本" value={`${surface.samples}`} tone="cyan" /></Col>
            <Col xs={12} sm={6}><Metric label="脚本" value={`${surface.scripts}`} tone="amber" /></Col>
            <Col xs={12} sm={6}><Metric label="剧本" value={`${scenarios.length}`} tone="green" /></Col>
            <Col xs={12} sm={6}><Metric label="风险" value={riskLabel[surface.risk]} tone={surface.risk === 'critical' ? 'red' : surface.risk === 'high' ? 'amber' : 'cyan'} /></Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col span={12}><SurfaceAttributeGroup title="攻击入口" items={surface.entry_points} /></Col>
            <Col span={12}><SurfaceAttributeGroup title="保护资产" items={surface.protected_assets} /></Col>
            <Col span={12}><SurfaceAttributeGroup title="攻击目标" items={surface.attacker_goals} /></Col>
            <Col span={12}><SurfaceAttributeGroup title="检测信号" items={surface.detection_signals} /></Col>
            <Col span={12}><SurfaceAttributeGroup title="评测重点" items={surface.evaluation_focus} /></Col>
            <Col span={12}><SurfaceAttributeGroup title="防御加固" items={surface.mitigations?.length ? surface.mitigations : [surface.defense]} /></Col>
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
          <Card 
            title={<Space orientation="vertical" size={0}><Typography.Text strong>关联剧本</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{scenarios.length} 个</Typography.Text></Space>} 
            variant="borderless"
            style={{ background: 'var(--ant-color-fill-quaternary)' }}
            styles={{ body: { padding: 0  }}}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {scenarios.map(scenario => {
                let scenarioColor = 'var(--ant-color-primary)';
                if(scenario.severity === 'critical') scenarioColor = 'var(--ant-color-error)';
                if(scenario.severity === 'high') scenarioColor = 'var(--ant-color-warning)';
                return (
                  <div
                    key={scenario.id}
                    onClick={() => onOpenScenario(scenario.id)}
                    style={{ padding: '16px', cursor: 'pointer', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: scenarioColor, marginTop: 6 }} />
                      <div>
                        <div><Typography.Text strong>{scenario.title}</Typography.Text></div>
                        <div style={{ marginTop: 4 }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{scenario.id} · {scenario.target}</Typography.Text></div>
                      </div>
                    </div>
                    <div>
                      <Play size={16} color="var(--ant-color-text-secondary)" />
                    </div>
                  </div>
                );
              })}
              {!scenarios.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>该攻击面暂无关联剧本。</div>}
            </div>
          </Card>
        </Col>
      </Row>
    </Card>  );
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
  const threatNodes = (pack?.threat_chain?.length ? pack.threat_chain : [
    { stage: '攻击入口', text: surface.entry_points?.[0] ?? '待补充' },
    { stage: '目标资产', text: surface.protected_assets?.[0] ?? '待补充' },
    { stage: '监督策略', text: surface.defense }
  ]).slice(0, 4);
  const coverageEntries = Object.entries(pack?.coverage_checks ?? {
    has_surface_profile: Boolean(surface.entry_points?.length && surface.protected_assets?.length),
    has_adversarial_samples: surface.samples > 0,
    has_jailbreak_cases: surface.samples > 0,
    has_agent_scripts: surface.scripts > 0,
    has_policy_expectations: false,
    has_runtime_evidence: false
  });
  const policyItems = pack?.policy_distribution.slice(0, 4) ?? [];
  const toolItems = pack?.tool_coverage.slice(0, 4) ?? [];
  const latestGuarded = mainScenario?.latest_guarded_result;
  const decisionTone = latestGuarded?.status === '已控制' ? 'success' : latestGuarded?.status === '攻击成功' ? 'error' : 'processing';

  return (
    <Card type="inner" style={{ marginBottom: 24 }} styles={{ body: { padding: 24  }}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>答辩单页</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>{surface.name}</Typography.Title>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Typography.Title level={2} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>{displayValue(`${summary?.readiness_score ?? 0}%`)}</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>证据完整度</Typography.Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ background: 'var(--ant-color-fill-tertiary)', padding: '16px', borderRadius: 8, marginBottom: 24 }}>
        <Col span={6}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>剧本</Typography.Text>
          <Typography.Text strong>{displayValue(summary?.scenario_count ?? scenarios.length)}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>样本/脚本</Typography.Text>
          <Typography.Text strong>{displayValue(`${summary?.sample_count ?? surface.samples}/${summary?.agent_script_count ?? surface.scripts}`)}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>控制率</Typography.Text>
          <Typography.Text strong>{displayValue(`${summary?.control_rate ?? 0}%`)}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>缺口</Typography.Text>
          <Typography.Text strong>{displayValue(summary?.gap_count ?? 0)}</Typography.Text>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>攻击链路</Typography.Text>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {threatNodes.map((node, index) => (
              <div key={`${node.stage}-${index}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ant-color-primary-bg)', color: 'var(--ant-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                  {index + 1}
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{node.stage}</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 13 }}>{node.text}</Typography.Text>
                </div>
              </div>
            ))}
          </Space>
        </Col>

        <Col span={8}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>监督命中</Typography.Text>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Tag color={decisionTone}>{latestGuarded?.status ?? '待验证'}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{mainScenario?.id ?? fallbackScenario?.id ?? '暂无剧本'}</Typography.Text>
            </Space>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>命中策略</Typography.Text>
          <Space size={[0, 8]} wrap style={{ marginBottom: 16 }}>
            {policyItems.length ? policyItems.map((item) => (
              <Tag key={item.policy_id} color="processing">{item.policy_id}</Tag>
            )) : <Typography.Text type="secondary" style={{ fontSize: 12 }}>加载中</Typography.Text>}
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>覆盖工具</Typography.Text>
          <Space size={[0, 8]} wrap>
            {toolItems.length ? toolItems.map((item) => (
              <Tag key={item.tool}>{item.tool}</Tag>
            )) : <Typography.Text type="secondary" style={{ fontSize: 12 }}>加载中</Typography.Text>}
          </Space>
        </Col>

        <Col span={8}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>验收闭环 <Typography.Text type="secondary">({coverageEntries.filter(([, checked]) => checked).length}/{coverageEntries.length})</Typography.Text></Typography.Text>
          <Space orientation="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
            {coverageEntries.map(([key, checked]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: checked ? 'var(--ant-color-success)' : 'var(--ant-color-text-quaternary)' }} />
                <Typography.Text type={checked ? undefined : 'secondary'} style={{ fontSize: 13, textDecoration: checked ? 'none' : 'line-through' }}>
                  {coverageLabel[key] ?? key}
                </Typography.Text>
              </div>
            ))}
          </Space>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Button block href={briefingSheetHref} target="_blank" icon={<ScrollText size={14} />}>打开独立单页</Button>
            <Button block type="dashed" href={markdownHref} target="_blank" icon={<ScrollText size={14} />}>Markdown</Button>
          </Space>
        </Col>
      </Row>
    </Card>  );
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
    <Card type="inner" title="攻击面证据包" extra={
      <Space>
        <Button type="link" size="small" href={jsonHref} target="_blank" icon={<ClipboardList size={14} />}>JSON</Button>
        <Button type="link" size="small" href={markdownHref} target="_blank" icon={<ScrollText size={14} />}>Markdown</Button>
      </Space>
    }>
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {!error && (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {topGaps.length > 0 && (
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>缺口提示 <Tag color="error">{pack?.summary.gap_count ?? 0}</Tag></Typography.Text>
              <Space orientation="vertical" style={{ width: '100%' }}>
                {topGaps.map((gap) => (
                  <Card size="small" key={`${gap.title}-${gap.evidence}`} style={{ borderLeft: `3px solid var(--ant-color-${gap.severity === 'high' ? 'error' : gap.severity === 'medium' ? 'warning' : 'info'})` }}>
                    <Typography.Text strong>{gap.title}</Typography.Text>
                    <Typography.Paragraph type="secondary" style={{ margin: '4px 0', fontSize: 13 }}>{gap.evidence}</Typography.Paragraph>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{gap.action}</Typography.Text>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>预期命中策略</Typography.Text>
            <Space size={[0, 8]} wrap>
              {topPolicies.length ? topPolicies.map((item) => (
                <Tag key={item.policy_id}>{item.policy_id} ({item.count})</Tag>
              )) : <Typography.Text type="secondary" style={{ fontSize: 13 }}>等待证据包加载</Typography.Text>}
            </Space>
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>关联剧本验证</Typography.Text>
            {topScenarios.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--ant-color-border-secondary)', borderRadius: 8, overflow: 'hidden' }}>
                {topScenarios.map((scenario: any) => {
                  const policies = scenario.expected_decisions.map((item: any) => item.policy_id).join(' / ') || '未记录';
                  const guarded = scenario.latest_guarded_result;
                  const statusTone = guarded.status === '已控制' ? 'success' : guarded.status === '攻击成功' ? 'error' : 'processing';
                  return (
                    <div key={scenario.id} style={{ padding: '8px 16px', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                      <Row style={{ width: '100%' }} align="middle">
                        <Col span={8}>
                          <Typography.Text strong style={{ display: 'block' }}>{scenario.id}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{scenario.target}</Typography.Text>
                        </Col>
                        <Col span={10}>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{policies}</Typography.Text>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Tag color={statusTone}>{guarded.status}</Tag>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            ) : <Typography.Text type="secondary">{loading ? '正在生成证据包...' : '暂无证据包数据。'}</Typography.Text>}
          </div>
        </Space>
      )}
    </Card>
  );
}
