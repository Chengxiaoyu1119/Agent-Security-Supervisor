import { Typography } from 'antd';
import {
  DemoReadinessTab,
  ExternalIntegrationTab,
  RuntimeGovernanceTab,
  SettingsBasicsTab,
  SupervisorDebugTab
} from '../components/settings';
import { useRuntimeGovernanceController } from '../components/settings/useRuntimeGovernanceController';
import { useSettingsPanelController } from '../components/settings/useSettingsPanelController';
import { UiTabs } from '../components/ui';
import type { Overview } from '../types';

export function SettingsPanel({ overview, refresh }: { overview: Overview; refresh: () => Promise<unknown> }) {
  const { state, actions } = useSettingsPanelController(refresh);
  const governance = useRuntimeGovernanceController(actions.setEvaluateError);

  return (
    <div className="zh-page-stack">
      <Typography.Title level={2}>模型与系统设置</Typography.Title>
      <UiTabs
        className="zh-settings-tabs"
        defaultActiveKey="1"
        size="large"
        items={[
          {
            key: '1',
            label: '基础配置与成果对齐',
            children: (
              <SettingsBasicsTab
                overview={overview}
                modelConfig={state.modelConfig}
                savingModelConfig={state.savingModelConfig}
                onModelConfigChange={actions.setModelConfig}
                onSaveModelConfig={actions.handleSaveModelConfig}
              />
            )
          },
          {
            key: '2',
            label: '运行体检与赛前核验',
            children: (
              <DemoReadinessTab
                overview={overview}
                attackDataset={state.attackDataset}
                demoDrill={state.demoDrill}
                runningDemoDrill={state.runningDemoDrill}
                handleRunDemoDrill={actions.handleRunDemoDrill}
                competitionReadiness={state.competitionReadiness}
                competitionReadinessOutput={state.competitionReadinessOutput}
                checkingReadiness={state.checkingReadiness}
                handleRunReadiness={actions.handleRunReadiness}
              />
            )
          },
          {
            key: '3',
            label: '外部接入与开放集成',
            children: (
              <ExternalIntegrationTab
                integrationBundle={state.integrationBundle}
                agentIntegrationBundle={state.agentIntegrationBundle}
                openClawPluginPackage={state.openClawPluginPackage}
                openClawPluginValidation={state.openClawPluginValidation}
                writingOpenClawPlugin={state.writingOpenClawPlugin}
                validatingOpenClawPlugin={state.validatingOpenClawPlugin}
                handleWriteOpenClawPlugin={actions.handleWriteOpenClawPlugin}
                handleValidateOpenClawPlugin={actions.handleValidateOpenClawPlugin}
              />
            )
          },
          {
            key: '4',
            label: '运行治理中心',
            children: (
              <RuntimeGovernanceTab
                authContext={governance.authContext}
                policySettings={governance.policySettings}
                metrics={governance.observabilityMetrics}
                memoryGovernance={governance.memoryGovernance}
                savingSettings={governance.savingSettings}
                refreshingGovernance={governance.refreshingGovernance}
                onSettingsChange={governance.setPolicySettings}
                onSaveSettings={governance.handleSavePolicySettings}
                onRefreshGovernance={governance.handleRefreshGovernance}
                onMemoryStatus={governance.handleMemoryStatus}
                onRollbackMemory={governance.handleRollbackMemory}
              />
            )
          },
          {
            key: '5',
            label: '测试与手工调试',
            children: (
              <SupervisorDebugTab
                externalAgentDemo={state.externalAgentDemo}
                runningExternalAgentDemo={state.runningExternalAgentDemo}
                handleRunExternalAgentDemo={actions.handleRunExternalAgentDemo}
                eventJson={state.eventJson}
                setEventJson={actions.setEventJson}
                batchJson={state.batchJson}
                setBatchJson={actions.setBatchJson}
                evaluation={state.evaluation}
                batchEvaluation={state.batchEvaluation}
                evaluating={state.evaluating}
                batchEvaluating={state.batchEvaluating}
                evaluateError={state.evaluateError}
                handleEvaluateEvent={actions.handleEvaluateEvent}
                handleBatchEvaluate={actions.handleBatchEvaluate}
                loadSingleExternalSample={actions.loadSingleExternalSample}
                loadBatchExternalSample={actions.loadBatchExternalSample}
                clearExternalResults={actions.clearExternalResults}
              />
            )
          }
        ]}
      />
    </div>
  );
}
