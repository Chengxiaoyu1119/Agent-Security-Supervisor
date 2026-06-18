import { Col, Row } from 'antd';
import { ExperimentControlPanel } from './ExperimentControlPanel';
import type { ExperimentLabProps } from './ExperimentLab.types';
import { ExperimentResultPanel } from './ExperimentResultPanel';
import { ScenarioSamplePanel } from './ScenarioSamplePanel';

export function ExperimentLab(props: ExperimentLabProps) {
  return (
    <Row gutter={[24, 24]} align="stretch">
      <Col xs={24} lg={8}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
}
