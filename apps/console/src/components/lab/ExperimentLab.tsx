import { Col, Row } from 'antd';
import { AttackFunctionLab } from './AttackFunctionLab';
import { AuthorizedTargetLab } from './AuthorizedTargetLab';
import { CapabilityReplayLab } from './CapabilityReplayLab';
import { DualModelJailbreakLab } from './DualModelJailbreakLab';
import { ExperimentControlPanel } from './ExperimentControlPanel';
import type { ExperimentLabProps } from './ExperimentLab.types';
import { ExperimentResultPanel } from './ExperimentResultPanel';
import { JailbreakRedteamLab } from './JailbreakRedteamLab';
import { PenetrationLearningLab } from './PenetrationLearningLab';
import { ScenarioSamplePanel } from './ScenarioSamplePanel';
import { UiTabs } from '../ui';

export function ExperimentLab(props: ExperimentLabProps) {
  return (
    <UiTabs
      defaultActiveKey="capability-replay"
      items={[
        {
          key: 'capability-replay',
          label: '一键复现',
          children: <CapabilityReplayLab refresh={props.refresh} />
        },
        {
          key: 'penetration-learning',
          label: '本地靶场攻破',
          children: <PenetrationLearningLab refresh={props.refresh} />
        },
        {
          key: 'function-lab',
          label: '攻击功能实验台',
          children: <AttackFunctionLab refresh={props.refresh} />
        },
        {
          key: 'jailbreak-redteam',
          label: '模型越狱对测',
          children: <JailbreakRedteamLab refresh={props.refresh} />
        },
        {
          key: 'dual-model-jailbreak',
          label: '双模型优化越狱',
          children: <DualModelJailbreakLab refresh={props.refresh} />
        },
        {
          key: 'authorized-target',
          label: '授权公网靶场',
          children: <AuthorizedTargetLab refresh={props.refresh} />
        },
        {
          key: 'script-replay',
          label: '脚本审计验证',
          children: (
            <Row gutter={[24, 24]} align="stretch">
              <Col xs={24} lg={8}>
                <div className="zh-lab-side-stack">
                  <ExperimentControlPanel
                    scenario={props.scenario}
                    scenarios={props.scenarios}
                    selected={props.selected}
                    setSelected={props.setSelected}
                    guardEnabled={props.guardEnabled}
                    setGuardEnabled={props.setGuardEnabled}
                    running={props.running}
                    run={props.run}
                    compare={props.compare}
                    batchCompare={props.batchCompare}
                  />
                  <ScenarioSamplePanel scenario={props.scenario} />
                </div>
              </Col>

              <Col xs={24} lg={16}>
                <ExperimentResultPanel
                  result={props.result}
                  compareResult={props.compareResult}
                  batchResult={props.batchResult}
                />
              </Col>
            </Row>
          )
        }
      ]}
    />
  );
}
