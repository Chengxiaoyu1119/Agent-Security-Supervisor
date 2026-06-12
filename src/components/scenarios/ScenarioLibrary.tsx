import { useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Input, Select, Button, Tag, Space, Descriptions } from 'antd';
import { Play } from 'lucide-react';
import type { Scenario } from '../../types';

const riskLabel: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低'
};

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
        ...(scenario.tags ?? []),
      ].join(' ').toLowerCase();
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
        <Card title={
          <Space>
            <Typography.Text strong>攻击剧本目录</Typography.Text>
            <Tag color="blue">{filteredScenarios.length}/{scenarios.length}</Tag>
          </Space>
        } variant="borderless" styles={{ body: { padding: 0  }}}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
            <Input 
              placeholder="搜索剧本、工具、标签..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ marginBottom: 12 }} 
              allowClear
            />
            <Select
              value={surfaceFilter}
              onChange={setSurfaceFilter}
              style={{ width: '100%', marginBottom: 12 }}
              options={[{label: '全部攻击面', value: '全部'}, ...surfaces.map(s => ({label: s, value: s}))]}
            />
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: '100%' }}
              options={[
                {label: '全部风险', value: '全部'},
                {label: '极高风险', value: 'critical'},
                {label: '高风险', value: 'high'},
                {label: '中风险', value: 'medium'},
                {label: '低风险', value: 'low'}
              ]}
            />
          </div>
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredScenarios.map(scenario => {
                let color = 'default';
                if(scenario.severity === 'critical') color = 'error';
                if(scenario.severity === 'high') color = 'warning';
                if(scenario.severity === 'medium') color = 'processing';
                
                return (
                  <div
                    key={scenario.id}
                    onClick={() => onSelect(scenario.id)}
                    style={{ 
                      padding: '12px 16px', 
                      cursor: 'pointer',
                      background: selected === scenario.id ? 'var(--ant-color-primary-bg)' : 'transparent',
                      borderLeft: selected === scenario.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent',
                      borderBottom: '1px solid var(--ant-color-border-secondary)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography.Text strong style={{ color: selected === scenario.id ? 'var(--ant-color-primary)' : 'inherit' }}>{scenario.title}</Typography.Text>
                        <Tag color={color} style={{ marginRight: 0 }}>{riskLabel[scenario.severity]}</Tag>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{scenario.id} · {scenario.target}</Typography.Text>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!filteredScenarios.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>没有匹配的攻击剧本。</div>}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={16} lg={18}>
        {active ? (
          <Card 
            title={
              <Space orientation="vertical" size={0}>
                <Typography.Title level={4} style={{ margin: 0 }}>{active.title}</Typography.Title>
                <Typography.Text type="secondary">{active.id} · {active.target}</Typography.Text>
              </Space>
            }
            extra={<Button type="primary" icon={<Play size={16} />} onClick={onOpenLab}>带入实验室</Button>}
            variant="borderless"
          >
            <div style={{ marginBottom: 24, padding: 16, background: active.severity === 'critical' ? 'var(--ant-color-error-bg)' : 'var(--ant-color-info-bg)', borderRadius: 8 }}>
              <Typography.Text strong style={{ color: active.severity === 'critical' ? 'var(--ant-color-error)' : 'inherit', marginRight: 8 }}>
                {riskLabel[active.severity]}风险
              </Typography.Text>
              <Typography.Text>{active.expected_risk}</Typography.Text>
            </div>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="模型对抗样本">{active.adversarial_prompt}</Descriptions.Item>
              <Descriptions.Item label="越狱测试用例">{active.jailbreak_case}</Descriptions.Item>
              <Descriptions.Item label="防御策略">{active.defense}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card type="inner" title="智能体攻击脚本" size="small">
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {active.script_steps.map((step) => <li key={step}><Typography.Text>{step}</Typography.Text></li>)}
                  </ol>
                </Card>
              </Col>
              {active.attack_path?.length ? (
                <Col span={12}>
                  <Card type="inner" title="攻击链路" size="small">
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                      {active.attack_path.map((step) => <li key={step}><Typography.Text>{step}</Typography.Text></li>)}
                    </ol>
                  </Card>
                </Col>
              ) : null}
              {active.success_criteria?.length ? (
                <Col span={12}>
                  <Card type="inner" title="成功判据" size="small">
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                      {active.success_criteria.map((item) => <li key={item}><Typography.Text>{item}</Typography.Text></li>)}
                    </ol>
                  </Card>
                </Col>
              ) : null}
            </Row>

            {active.tags?.length ? (
              <div style={{ marginTop: 24 }}>
                {active.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
              </div>
            ) : null}

            {active.tool_calls.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Typography.Title level={5}>工具调用参数</Typography.Title>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {active.tool_calls.map((call) => (
                    <pre key={`${call.tool}-${call.risk_hint}`} style={{ padding: 16, background: 'var(--ant-color-bg-container-disabled)', borderRadius: 8, margin: 0 }}>
{`${call.tool}
risk_hint: ${call.risk_hint}
arguments: ${JSON.stringify(call.arguments, null, 2)}`}
                    </pre>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        ) : (
          <Card variant="borderless">
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>暂无攻击剧本。</div>
          </Card>
        )}
      </Col>
    </Row>  );
}
