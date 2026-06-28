import { Col, Row, Space, Typography } from 'antd';
import { Play, ShieldCheck } from 'lucide-react';
import type { AttackSurface, Scenario, SurfaceEvidencePack } from '@/types';
import { EvidenceCodeBlock, LabelTag, PanelCard, UiButton, UiTabs } from '../ui';

const EMPTY_TEXT = '暂无配置';

function displayItems(items: string[] | undefined, fallback = EMPTY_TEXT): string[] {
  return items && items.length > 0 ? items : [fallback];
}

function compactList(items: string[], className = 'zh-surface-brief-step') {
  return (
    <div className="zh-surface-brief-list">
      {items.map((item, index) => (
        <div className={className} key={`${item}-${index}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

function formatToolCalls(
  scenario?: Scenario,
  expectedDecisions: SurfaceEvidencePack['scenarios'][number]['expected_decisions'] = [],
): string {
  if (!scenario || scenario.tool_calls.length === 0) {
    return '// 暂无工具调用脚本';
  }
  return scenario.tool_calls
    .map((call, index) => {
      const decision = expectedDecisions.find((item) => item.tool === call.tool) ?? expectedDecisions[index];
      return [
        `// 步骤 ${index + 1}: ${call.tool}`,
        `工具: ${call.tool}`,
        `入参: ${JSON.stringify(call.arguments, null, 2)}`,
        `期望监督动作: ${decision?.decision ?? '基于策略判断'}`,
        `判定依据: ${decision?.reason ?? call.risk_hint}`,
      ].join('\n');
    })
    .join('\n\n');
}

type SurfaceAttackPlaybookPanelProps = {
  surface: AttackSurface;
  scenarios: Scenario[];
  pack?: SurfaceEvidencePack | null;
  running?: boolean;
  onOpenScenario?: (scenarioId: string) => void;
  onBatchCompare?: (scenarioIds: string[], label: string) => void;
};

export function SurfaceAttackPlaybookPanel({
  surface,
  scenarios,
  pack,
  running = false,
  onOpenScenario,
  onBatchCompare,
}: SurfaceAttackPlaybookPanelProps) {
  const representativeScenario = scenarios[0];
  const packScenario =
    pack?.scenarios.find((item) => item.id === representativeScenario?.id) ??
    pack?.scenarios.find((item) => item.surface_id === surface.id);
  const scenarioIds = scenarios.map((scenario) => scenario.id);
  const expectedDecisions = packScenario?.expected_decisions ?? [];
  const attackPath = representativeScenario?.attack_path ?? [];
  const scriptSteps = representativeScenario?.script_steps ?? [];
  const detectionPoints = representativeScenario?.detection_points ?? [];
  const guardedAuditHash = packScenario?.latest_guarded_result?.audit_hash;

  return (
    <PanelCard
      title={
        <Space align="center" size={8} wrap>
          <Play size={18} />
          攻击利用与防护脚本
        </Space>
      }
      extra={<LabelTag color="red">{surface.risk} 风险</LabelTag>}
      className="zh-surface-attack-playbook"
    >
      <Space direction="vertical" size={16} className="zh-full-width">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Paragraph className="zh-muted-text zh-zero-margin">
              这里把“攻击输入、工具调用、监督判定、防护处置”收拢成可切换脚本，评委不用一路向下滚动，也能逐项查看每类攻击如何被利用和拦截。
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={8}>
            <div className="zh-surface-playbook-counter">
              <strong>{scenarioIds.length}</strong>
              <span>个关联脚本</span>
            </div>
          </Col>
        </Row>

        <UiTabs
          defaultActiveKey="exploit"
          size="small"
          items={[
            {
              key: 'exploit',
              label: '利用方式',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>攻击者怎么利用</Typography.Text>
                      {compactList(displayItems(surface.attacker_goals))}
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>系统重点保护什么</Typography.Text>
                      {compactList(displayItems(surface.protected_assets))}
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'sample',
              label: '对抗样本',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>代表性对抗输入</Typography.Text>
                      {compactList(displayItems(representativeScenario?.adversarial_prompt ? [representativeScenario.adversarial_prompt] : []))}
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>越狱或伪装方式</Typography.Text>
                      {compactList(displayItems(representativeScenario?.jailbreak_case ? [representativeScenario.jailbreak_case] : []))}
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'tool-script',
              label: '工具脚本',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={11}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>智能体攻击步骤</Typography.Text>
                      {compactList(displayItems(scriptSteps))}
                    </div>
                  </Col>
                  <Col xs={24} lg={13}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>模拟业务工具调用链</Typography.Text>
                      <EvidenceCodeBlock size="small" maxHeight="large">
                        {formatToolCalls(representativeScenario, expectedDecisions)}
                      </EvidenceCodeBlock>
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'defense',
              label: '监督处置',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>监测点</Typography.Text>
                      {compactList(displayItems(detectionPoints))}
                    </div>
                  </Col>
                  <Col xs={24} lg={8}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>预期判定</Typography.Text>
                      {compactList(
                        displayItems(
                          expectedDecisions.map(
                            (decision) => `${decision.tool}: ${decision.decision} - ${decision.reason}`,
                          ),
                        ),
                      )}
                    </div>
                  </Col>
                  <Col xs={24} lg={8}>
                    <div className="zh-surface-brief-block">
                      <Typography.Text strong>防护闭环</Typography.Text>
                      {compactList(
                        displayItems(
                          [
                            ...(surface.mitigations?.length ? surface.mitigations : [surface.defense]),
                            ...attackPath,
                            guardedAuditHash ? `审计证据哈希: ${guardedAuditHash}` : '',
                          ].filter(Boolean),
                        ),
                      )}
                    </div>
                  </Col>
                </Row>
              ),
            },
          ]}
        />

        <Space size={8} wrap>
          <UiButton
            type="primary"
            icon={<Play size={16} />}
            disabled={running || !representativeScenario}
            onClick={() => representativeScenario && onBatchCompare?.([representativeScenario.id], representativeScenario.title)}
          >
            {running ? '验证中...' : '运行代表脚本'}
          </UiButton>
          <UiButton
            icon={<ShieldCheck size={16} />}
            disabled={!representativeScenario}
            onClick={() => representativeScenario && onOpenScenario?.(representativeScenario.id)}
          >
            查看脚本详情
          </UiButton>
          {expectedDecisions.slice(0, 3).map((decision) => (
            <LabelTag color="orange" key={`${decision.step}-${decision.tool}`}>
              监督 {decision.decision} {decision.tool}
            </LabelTag>
          ))}
        </Space>
      </Space>
    </PanelCard>
  );
}
