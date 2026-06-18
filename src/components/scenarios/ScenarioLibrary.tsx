import { useMemo, useState } from 'react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import { Play } from 'lucide-react';
import type { Scenario } from '../../types';
import { riskLabel } from '../../utils';
import { EvidenceCodeBlock, LabelTag, PanelCard, UiButton, UiInput, UiSelect } from '../ui';

export function ScenarioLibrary({
  scenarios,
  selected,
  onSelect,
  onOpenLab
}: {
  scenarios: Scenario[];
  selected: string;
  onSelect: (id: string) => void;
  onOpenLab: () => void;
}) {
  const [query, setQuery] = useState('');
  const [surfaceFilter, setSurfaceFilter] = useState('全部');
  const [severityFilter, setSeverityFilter] = useState('全部');
  const surfaces = useMemo(() => Array.from(new Set(scenarios.map((scenario) => scenario.surface_id))), [scenarios]);
  const filteredScenarios = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      const text = [
        scenario.id,
        scenario.surface_id,
        scenario.title,
        scenario.target,
        scenario.adversarial_prompt,
        scenario.jailbreak_case,
        scenario.expected_risk,
        scenario.defense,
        ...(scenario.tags ?? [])
      ]
        .join(' ')
        .toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (surfaceFilter === '全部' || scenario.surface_id === surfaceFilter) &&
        (severityFilter === '全部' || scenario.severity === severityFilter)
      );
    });
  }, [query, scenarios, severityFilter, surfaceFilter]);
  const active = scenarios.find((scenario) => scenario.id === selected) ?? scenarios[0];
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={8} lg={6}>
        <PanelCard
          title={
            <Space>
              <Typography.Text strong>攻击剧本目录</Typography.Text>
              <LabelTag color="blue">
                {filteredScenarios.length}/{scenarios.length}
              </LabelTag>
            </Space>
          }
          variant="borderless"
          bodyPadding={0}
        >
          <div className="zh-filter-panel">
            <UiInput
              placeholder="搜索剧本、工具、标签..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="zh-mb-12"
              allowClear
            />
            <UiSelect
              value={surfaceFilter}
              onChange={setSurfaceFilter}
              className="zh-full-width zh-mb-12"
              options={[{ label: '全部攻击面', value: '全部' }, ...surfaces.map((s) => ({ label: s, value: s }))]}
            />
            <UiSelect
              value={severityFilter}
              onChange={setSeverityFilter}
              className="zh-full-width"
              options={[
                { label: '全部风险', value: '全部' },
                { label: '极高风险', value: 'critical' },
                { label: '高风险', value: 'high' },
                { label: '中风险', value: 'medium' },
                { label: '低风险', value: 'low' }
              ]}
            />
          </div>
          <div className="zh-scroll-list zh-scroll-list--scenario">
            <div className="zh-column-stack">
              {filteredScenarios.map((scenario) => {
                let color = 'default';
                if (scenario.severity === 'critical') color = 'error';
                if (scenario.severity === 'high') color = 'warning';
                if (scenario.severity === 'medium') color = 'processing';

                return (
                  <div
                    key={scenario.id}
                    onClick={() => onSelect(scenario.id)}
                    className={`zh-selectable-list-item${selected === scenario.id ? ' zh-selectable-list-item--active' : ''}`}
                  >
                    <div>
                      <div className="zh-split-row">
                        <Typography.Text strong className={selected === scenario.id ? 'zh-text-primary-active' : ''}>
                          {scenario.title}
                        </Typography.Text>
                        <LabelTag color={color} className="zh-mr-0">
                          {riskLabel[scenario.severity]}
                        </LabelTag>
                      </div>
                      <div className="zh-mt-4">
                        <Typography.Text type="secondary" className="zh-text-meta">
                          {scenario.id} · {scenario.target}
                        </Typography.Text>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!filteredScenarios.length && <div className="zh-empty-panel">没有匹配的攻击剧本。</div>}
          </div>
        </PanelCard>
      </Col>

      <Col xs={24} md={16} lg={18}>
        {active ? (
          <PanelCard
            title={
              <Space orientation="vertical" size={0}>
                <Typography.Title level={4} className="zh-title-flush">
                  {active.title}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {active.id} · {active.target}
                </Typography.Text>
              </Space>
            }
            extra={
              <UiButton type="primary" icon={<Play size={16} />} onClick={onOpenLab}>
                带入实验室
              </UiButton>
            }
            variant="borderless"
          >
            <div
              className={`zh-risk-summary ${
                active.severity === 'critical' ? 'zh-risk-summary--critical' : 'zh-risk-summary--info'
              }`}
            >
              <Typography.Text
                strong
                className={`zh-mr-8 ${active.severity === 'critical' ? 'zh-risk-summary__label--critical' : ''}`}
              >
                {riskLabel[active.severity]}风险
              </Typography.Text>
              <Typography.Text>{active.expected_risk}</Typography.Text>
            </div>

            <Descriptions column={1} bordered size="small" className="zh-mb-24">
              <Descriptions.Item label="模型对抗样本">{active.adversarial_prompt}</Descriptions.Item>
              <Descriptions.Item label="越狱测试用例">{active.jailbreak_case}</Descriptions.Item>
              <Descriptions.Item label="防御策略">{active.defense}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <PanelCard type="inner" title="智能体攻击脚本" size="small">
                  <ol className="zh-ordered-list">
                    {active.script_steps.map((step) => (
                      <li key={step}>
                        <Typography.Text>{step}</Typography.Text>
                      </li>
                    ))}
                  </ol>
                </PanelCard>
              </Col>
              {active.attack_path?.length ? (
                <Col span={12}>
                  <PanelCard type="inner" title="攻击链路" size="small">
                    <ol className="zh-ordered-list">
                      {active.attack_path.map((step) => (
                        <li key={step}>
                          <Typography.Text>{step}</Typography.Text>
                        </li>
                      ))}
                    </ol>
                  </PanelCard>
                </Col>
              ) : null}
              {active.success_criteria?.length ? (
                <Col span={12}>
                  <PanelCard type="inner" title="成功判据" size="small">
                    <ol className="zh-ordered-list">
                      {active.success_criteria.map((item) => (
                        <li key={item}>
                          <Typography.Text>{item}</Typography.Text>
                        </li>
                      ))}
                    </ol>
                  </PanelCard>
                </Col>
              ) : null}
            </Row>

            {active.tags?.length ? (
              <div className="zh-mt-24">
                {active.tags.map((tag) => (
                  <LabelTag key={tag}>{tag}</LabelTag>
                ))}
              </div>
            ) : null}

            {active.tool_calls.length > 0 && (
              <div className="zh-mt-24">
                <Typography.Title level={5}>工具调用参数</Typography.Title>
                <Space orientation="vertical" className="zh-full-width">
                  {active.tool_calls.map((call) => (
                    <EvidenceCodeBlock key={`${call.tool}-${call.risk_hint}`} flush>
                      {`${call.tool}
risk_hint: ${call.risk_hint}
arguments: ${JSON.stringify(call.arguments, null, 2)}`}
                    </EvidenceCodeBlock>
                  ))}
                </Space>
              </div>
            )}
          </PanelCard>
        ) : (
          <PanelCard variant="borderless">
            <div className="zh-empty-panel zh-empty-panel--large">暂无攻击剧本。</div>
          </PanelCard>
        )}
      </Col>
    </Row>
  );
}
