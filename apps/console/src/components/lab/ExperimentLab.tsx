import { Col, Row } from 'antd';
import { AttackFunctionLab } from './AttackFunctionLab';
import { AttackTestsetLab } from './AttackTestsetLab';
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
  const auditReplayPanel = (
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
  );

  return (
    <UiTabs
      defaultActiveKey="basic-replay"
      className="zh-lab-category-tabs"
      items={[
        {
          key: 'basic-replay',
          label: '基础复现',
          children: (
            <UiTabs
              defaultActiveKey="penetration-learning"
              className="zh-lab-sub-tabs"
              items={[
                {
                  key: 'penetration-learning',
                  label: '本地受控实验',
                  children: <PenetrationLearningLab refresh={props.refresh} />
                },
                {
                  key: 'function-lab',
                  label: '攻击功能实验台',
                  children: <AttackFunctionLab refresh={props.refresh} />
                },
                {
                  key: 'attack-testsets',
                  label: '红队测试集',
                  children: <AttackTestsetLab />
                }
              ]}
            />
          )
        },
        {
          key: 'model-jailbreak',
          label: '模型越狱',
          children: (
            <UiTabs
              defaultActiveKey="jailbreak-redteam"
              className="zh-lab-sub-tabs"
              items={[
                {
                  key: 'jailbreak-redteam',
                  label: '模型越狱对测',
                  children: <JailbreakRedteamLab refresh={props.refresh} />
                },
                {
                  key: 'dual-model-jailbreak',
                  label: '双模型优化越狱',
                  children: <DualModelJailbreakLab refresh={props.refresh} />
                }
              ]}
            />
          )
        },
        {
          key: 'external-access',
          label: '外部接入',
          children: (
            <UiTabs
              defaultActiveKey="authorized-target"
              className="zh-lab-sub-tabs"
              items={[
                {
                  key: 'authorized-target',
                  label: '外部授权目标',
                  children: <AuthorizedTargetLab refresh={props.refresh} />
                },
                {
                  key: 'capability-replay',
                  label: '快速验收',
                  children: <CapabilityReplayLab refresh={props.refresh} />
                },
                {
                  key: 'script-replay',
                  label: '审计用例验证',
                  children: auditReplayPanel
                }
              ]}
            />
          )
        }
      ]}
    />
  );
}
