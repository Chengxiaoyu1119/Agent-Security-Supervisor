import { Row, Col, Typography, Space, Divider, Statistic } from 'antd';
import { Play, Database, ShieldAlert, GitMerge } from 'lucide-react';
import type { AttackSurface, StudentCompetitionAttackProfile } from '@/types';
import { riskLabel } from '@/utils';
import { LabelTag, PanelCard } from '../ui';

export function SurfaceResearchMatrix({
  surfaces,
  profiles = []
}: {
  surfaces: AttackSurface[];
  profiles?: StudentCompetitionAttackProfile[];
}) {
  const highRiskCount = profiles.filter((profile) => ['critical', 'high'].includes(profile.risk)).length;
  const scenarioCount = new Set(profiles.flatMap((profile) => profile.demo_scenarios)).size;
  const displayedProfiles = profiles.length
    ? profiles
    : surfaces.map((surface) => ({
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
    <PanelCard variant="borderless" className="zh-mb-24">
      <div className="zh-surface-matrix-hero">
        <Typography.Text type="secondary">学生比赛攻击面画像</Typography.Text>
        <Typography.Title level={2} className="zh-surface-matrix-hero__title">
          把抽象安全风险落到真实比赛对象
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="zh-surface-matrix-hero__summary">
          画像层把提示注入、工具劫持、数据泄露等攻击面，映射到队伍账号、赛题附件、提交物、私有榜单和训练平台会话。这样答辩时能讲清楚攻击从哪里进、碰到什么资产、由哪条策略拦截。
        </Typography.Paragraph>
        <Space size="large" className="zh-surface-matrix-hero__stats">
          <Statistic value={displayedProfiles.length} suffix="类比赛对象" className="zh-surface-matrix-stat" />
          <Statistic value={scenarioCount || surfaces.length} suffix="个关联剧本" className="zh-surface-matrix-stat" />
          <Statistic
            value={highRiskCount || surfaces.filter((surface) => ['critical', 'high'].includes(surface.risk)).length}
            suffix="个高风险对象"
            className="zh-surface-matrix-stat zh-surface-matrix-stat--danger"
          />
        </Space>
      </div>

      <Row gutter={[24, 24]} className="zh-surface-matrix-grid">
        {displayedProfiles.map((profile) => {
          let color = 'default';
          if (profile.risk === 'critical') {
            color = 'error';
          }
          if (profile.risk === 'high') {
            color = 'warning';
          }
          if (profile.risk === 'medium') {
            color = 'processing';
          }

          return (
            <Col xs={24} md={12} xl={8} key={profile.id}>
              <PanelCard
                type="inner"
                className={`zh-surface-matrix-card zh-surface-matrix-card--${profile.risk}`}
                hoverable
                title={
                  <div className="zh-surface-matrix-title">
                    <div>
                      <Typography.Text strong className="zh-text-lg zh-text-block">
                        {profile.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-surface-matrix-id">
                        {profile.id}
                      </Typography.Text>
                    </div>
                  </div>
                }
                extra={
                  <LabelTag color={color} className="zh-surface-matrix-tag">
                    {profile.status} · {riskLabel[profile.risk]}风险
                  </LabelTag>
                }
              >
                <Typography.Paragraph type="secondary" className="zh-surface-matrix-description">
                  {profile.why}
                </Typography.Paragraph>

                <div className="zh-surface-matrix-strip">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Typography.Text type="secondary" className="zh-surface-matrix-label">
                        <GitMerge size={12} className="zh-surface-matrix-label-icon" />
                        入口
                      </Typography.Text>
                      <Space orientation="vertical" size={6} className="zh-full-width">
                        {(profile.entry_points ?? []).slice(0, 3).map((item) => (
                          <LabelTag
                            key={`entry-${profile.id}-${item}`}
                            color="blue"
                            variant="filled"
                            className="zh-surface-matrix-block-tag"
                          >
                            {item}
                          </LabelTag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" className="zh-surface-matrix-label">
                        <Database size={12} className="zh-surface-matrix-label-icon" />
                        资产
                      </Typography.Text>
                      <Space orientation="vertical" size={6} className="zh-full-width">
                        {(profile.protected_assets ?? []).slice(0, 3).map((item) => (
                          <LabelTag
                            key={`asset-${profile.id}-${item}`}
                            color="green"
                            variant="filled"
                            className="zh-surface-matrix-block-tag"
                          >
                            {item}
                          </LabelTag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" className="zh-surface-matrix-label">
                        <ShieldAlert size={12} className="zh-surface-matrix-label-icon" />
                        监督
                      </Typography.Text>
                      <Space orientation="vertical" size={6} className="zh-full-width">
                        {(profile.supervision ?? []).slice(0, 3).map((item) => (
                          <LabelTag
                            key={`guard-${profile.id}-${item}`}
                            color="purple"
                            variant="filled"
                            className="zh-surface-matrix-block-tag"
                          >
                            {item}
                          </LabelTag>
                        ))}
                      </Space>
                    </Col>
                  </Row>
                </div>

                {profile.attacker_paths?.length ? (
                  <div className="zh-surface-matrix-section">
                    <Typography.Text type="secondary" className="zh-surface-matrix-label">
                      攻击路径
                    </Typography.Text>
                    <Space size={[0, 8]} wrap>
                      {profile.attacker_paths.slice(0, 4).map((item) => (
                        <LabelTag variant="filled" key={`path-${profile.id}-${item}`}>
                          {item}
                        </LabelTag>
                      ))}
                    </Space>
                  </div>
                ) : null}

                {profile.demo_scenarios?.length ? (
                  <div>
                    <Typography.Text type="secondary" className="zh-surface-matrix-label">
                      关联剧本
                    </Typography.Text>
                    <Space size={[0, 8]} wrap>
                      {profile.demo_scenarios.slice(0, 4).map((scenario) => (
                        <LabelTag
                          icon={<Play size={12} className="zh-surface-matrix-scenario-icon" />}
                          color="cyan"
                          key={`scenario-${profile.id}-${scenario}`}
                          className="zh-surface-matrix-code-tag"
                        >
                          {scenario}
                        </LabelTag>
                      ))}
                    </Space>
                  </div>
                ) : null}
              </PanelCard>
            </Col>
          );
        })}
      </Row>

      <Divider className="zh-surface-matrix-divider">基础攻击面矩阵</Divider>

      <Row gutter={[16, 16]}>
        {surfaces.map((surface) => {
          let color = 'default';
          if (surface.risk === 'critical') color = 'error';
          if (surface.risk === 'high') color = 'warning';
          if (surface.risk === 'medium') color = 'processing';
          return (
            <Col xs={24} md={12} xl={8} key={surface.id}>
              <PanelCard type="inner" className="zh-surface-matrix-base-card">
                <div className="zh-surface-matrix-base-head">
                  <Typography.Text strong>{surface.name}</Typography.Text>
                  <LabelTag color={color} variant="filled" className="zh-surface-matrix-tag">
                    {surface.status} · {riskLabel[surface.risk]}风险
                  </LabelTag>
                </div>
                <Space orientation="vertical" size={8} className="zh-full-width">
                  <div className="zh-surface-matrix-row">
                    <Typography.Text type="secondary" className="zh-surface-matrix-row-label">
                      入口：
                    </Typography.Text>
                    <div className="zh-surface-matrix-row-tags">
                      {(surface.entry_points ?? []).slice(0, 3).map((i) => (
                        <LabelTag key={i} variant="filled" color="blue" className="zh-surface-matrix-small-tag">
                          {i}
                        </LabelTag>
                      ))}
                    </div>
                  </div>
                  <div className="zh-surface-matrix-row">
                    <Typography.Text type="secondary" className="zh-surface-matrix-row-label">
                      资产：
                    </Typography.Text>
                    <div className="zh-surface-matrix-row-tags">
                      {(surface.protected_assets ?? []).slice(0, 3).map((i) => (
                        <LabelTag key={i} variant="filled" color="green" className="zh-surface-matrix-small-tag">
                          {i}
                        </LabelTag>
                      ))}
                    </div>
                  </div>
                  <div className="zh-surface-matrix-row">
                    <Typography.Text type="secondary" className="zh-surface-matrix-row-label">
                      信号：
                    </Typography.Text>
                    <div className="zh-surface-matrix-row-tags">
                      {(surface.detection_signals ?? []).slice(0, 3).map((i) => (
                        <LabelTag key={i} variant="filled" color="orange" className="zh-surface-matrix-small-tag">
                          {i}
                        </LabelTag>
                      ))}
                    </div>
                  </div>
                  <div className="zh-surface-matrix-row">
                    <Typography.Text type="secondary" className="zh-surface-matrix-row-label">
                      评测：
                    </Typography.Text>
                    <div className="zh-surface-matrix-row-tags">
                      {(surface.evaluation_focus ?? []).slice(0, 2).map((i) => (
                        <LabelTag key={i} variant="filled" color="purple" className="zh-surface-matrix-small-tag">
                          {i}
                        </LabelTag>
                      ))}
                    </div>
                  </div>
                </Space>
              </PanelCard>
            </Col>
          );
        })}
      </Row>
    </PanelCard>
  );
}
