import { Card, Row, Col, Typography, Space, Tag, Divider, Statistic } from 'antd';
import { Play, Database, ShieldAlert, GitMerge } from 'lucide-react';
import type { AttackSurface, StudentCompetitionAttackProfile } from '../../types';

const riskLabel: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低'
};

export function SurfaceResearchMatrix({
  surfaces,
  profiles = []
}: {
  surfaces: AttackSurface[];
  profiles?: StudentCompetitionAttackProfile[];
}) {
  const highRiskCount = profiles.filter((profile) => ['critical', 'high'].includes(profile.risk)).length;
  const scenarioCount = new Set(profiles.flatMap((profile) => profile.demo_scenarios)).size;
  const displayedProfiles = profiles.length ? profiles : surfaces.map((surface) => ({
    id: surface.id,
    name: surface.name,
    risk: surface.risk,
    status: surface.status,
    why: surface.summary,
    entry_points: surface.entry_points ?? [],
    protected_assets: surface.protected_assets ?? [],
    attacker_paths: surface.attacker_goals ?? [],
    supervision: surface.mitigations ?? [surface.defense],
    demo_scenarios: []
  }));

  return (
    <Card variant="borderless" style={{ marginBottom: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 800, margin: '0 auto 40px' }}>
        <Typography.Text type="secondary">学生比赛攻击面画像</Typography.Text>
        <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 16 }}>把抽象安全风险落到真实比赛对象</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 16 }}>
          画像层把提示注入、工具劫持、数据泄露等攻击面，映射到队伍账号、赛题附件、提交物、私有榜单和训练平台会话。这样答辩时能讲清楚攻击从哪里进、碰到什么资产、由哪条策略拦截。
        </Typography.Paragraph>
        <Space size="large" style={{ marginTop: 24 }}>
          <Statistic value={displayedProfiles.length} suffix="类比赛对象" styles={{ content: { fontSize: 24  }}} />
          <Statistic value={scenarioCount || surfaces.length} suffix="个关联剧本" styles={{ content: { fontSize: 24  }}} />
          <Statistic value={highRiskCount || surfaces.filter((surface) => ['critical', 'high'].includes(surface.risk)).length} suffix="个高风险对象" styles={{ content: { fontSize: 24, color: 'var(--ant-color-error)'  }}} />
        </Space>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        {displayedProfiles.map((profile) => {
          let color = 'default';
          let borderTone = 'var(--ant-color-border-secondary)';
          if(profile.risk === 'critical') { color = 'error'; borderTone = 'var(--ant-color-error-border)'; }
          if(profile.risk === 'high') { color = 'warning'; borderTone = 'var(--ant-color-warning-border)'; }
          if(profile.risk === 'medium') { color = 'processing'; }
          
          return (
            <Col xs={24} md={12} xl={8} key={profile.id}>
              <Card 
                type="inner" 
                style={{ height: '100%', borderColor: borderTone, transition: 'all 0.3s' }}
                hoverable
                styles={{ header: { borderBottom: `1px solid ${borderTone}`, background: 'var(--ant-color-fill-quaternary)' } }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 16, display: 'block' }}>{profile.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>{profile.id}</Typography.Text>
                    </div>
                  </div>
                }
                extra={<Tag color={color} style={{ margin: 0 }}>{profile.status} · {riskLabel[profile.risk]}风险</Tag>}
              >
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, minHeight: 44, marginBottom: 24 }}>{profile.why}</Typography.Paragraph>
                
                <div style={{ background: 'var(--ant-color-fill-quaternary)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}><GitMerge size={12} style={{marginRight: 4}} />入口</Typography.Text>
                      <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                        {(profile.entry_points ?? []).slice(0, 3).map((item) => (
                          <Tag key={`entry-${profile.id}-${item}`} color="blue" variant="filled" style={{ margin: 0, width: '100%', whiteSpace: 'normal', display: 'block', lineHeight: '1.4', padding: '4px 8px' }}>
                            {item}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}><Database size={12} style={{marginRight: 4}} />资产</Typography.Text>
                      <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                        {(profile.protected_assets ?? []).slice(0, 3).map((item) => (
                          <Tag key={`asset-${profile.id}-${item}`} color="green" variant="filled" style={{ margin: 0, width: '100%', whiteSpace: 'normal', display: 'block', lineHeight: '1.4', padding: '4px 8px' }}>
                            {item}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}><ShieldAlert size={12} style={{marginRight: 4}} />监督</Typography.Text>
                      <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                        {(profile.supervision ?? []).slice(0, 3).map((item) => (
                          <Tag key={`guard-${profile.id}-${item}`} color="purple" variant="filled" style={{ margin: 0, width: '100%', whiteSpace: 'normal', display: 'block', lineHeight: '1.4', padding: '4px 8px' }}>
                            {item}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                  </Row>
                </div>

                {profile.attacker_paths?.length ? (
                  <div style={{ marginBottom: 16 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>攻击路径</Typography.Text>
                    <Space size={[0, 8]} wrap>
                      {profile.attacker_paths.slice(0, 4).map(item => <Tag variant="filled" key={`path-${profile.id}-${item}`}>{item}</Tag>)}
                    </Space>
                  </div>
                ) : null}

                {profile.demo_scenarios?.length ? (
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>关联剧本</Typography.Text>
                    <Space size={[0, 8]} wrap>
                      {profile.demo_scenarios.slice(0, 4).map((scenario) => (
                        <Tag 
                          icon={<Play size={12} style={{ marginRight: 4, verticalAlign: '-2px' }} />} 
                          color="cyan" 
                          key={`scenario-${profile.id}-${scenario}`} 
                          style={{ fontFamily: 'monospace', padding: '4px 8px' }}
                        >
                          {scenario}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                ) : null}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Divider style={{ borderColor: 'var(--ant-color-border)' }}>基础攻击面矩阵</Divider>
      
      <Row gutter={[16, 16]}>
        {surfaces.map((surface) => {
          let color = 'default';
          if(surface.risk === 'critical') color = 'error';
          if(surface.risk === 'high') color = 'warning';
          if(surface.risk === 'medium') color = 'processing';
          return (
            <Col xs={24} md={12} xl={8} key={surface.id}>
              <Card type="inner" style={{ height: '100%', background: 'var(--ant-color-fill-quaternary)', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Typography.Text strong>{surface.name}</Typography.Text>
                  <Tag color={color} variant="filled" style={{ margin: 0 }}>{surface.status} · {riskLabel[surface.risk]}风险</Tag>
                </div>
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8 }}><Typography.Text type="secondary" style={{ fontSize: 12, width: 40, flexShrink: 0 }}>入口：</Typography.Text><div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(surface.entry_points ?? []).slice(0, 3).map(i => <Tag key={i} variant="filled" color="blue" style={{ margin: 0, fontSize: 12 }}>{i}</Tag>)}</div></div>
                  <div style={{ display: 'flex', gap: 8 }}><Typography.Text type="secondary" style={{ fontSize: 12, width: 40, flexShrink: 0 }}>资产：</Typography.Text><div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(surface.protected_assets ?? []).slice(0, 3).map(i => <Tag key={i} variant="filled" color="green" style={{ margin: 0, fontSize: 12 }}>{i}</Tag>)}</div></div>
                  <div style={{ display: 'flex', gap: 8 }}><Typography.Text type="secondary" style={{ fontSize: 12, width: 40, flexShrink: 0 }}>信号：</Typography.Text><div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(surface.detection_signals ?? []).slice(0, 3).map(i => <Tag key={i} variant="filled" color="orange" style={{ margin: 0, fontSize: 12 }}>{i}</Tag>)}</div></div>
                  <div style={{ display: 'flex', gap: 8 }}><Typography.Text type="secondary" style={{ fontSize: 12, width: 40, flexShrink: 0 }}>评测：</Typography.Text><div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(surface.evaluation_focus ?? []).slice(0, 2).map(i => <Tag key={i} variant="filled" color="purple" style={{ margin: 0, fontSize: 12 }}>{i}</Tag>)}</div></div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>  );
}
