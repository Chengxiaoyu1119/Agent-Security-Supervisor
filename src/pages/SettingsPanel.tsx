import { useEffect, useState } from 'react';
import { Tabs, Typography } from 'antd';
import {
  DemoReadinessTab,
  ExternalIntegrationTab,
  SettingsBasicsTab,
  SupervisorDebugTab
} from '../components/settings';
import {
  fetchAttackCaseDataset,
  fetchOpenClawIntegrationBundle,
  writeOpenClawPluginPackage,
  writeOpenClawPluginValidation,
  fetchCompetitionReadiness,
  writeCompetitionReadiness,
  fetchDemoDrill,
  runDemoDrill,
  runExternalAgentDemo,
  evaluateSupervisorEvent,
  evaluateSupervisorBatch
} from '../api';
import type {
  SupervisorEvaluation,
  SupervisorBatchEvaluation,
  ExternalAgentDemoResult,
  OpenClawIntegrationBundle,
  OpenClawPluginPackageResult,
  OpenClawPluginValidationWriteResult,
  CompetitionReadiness,
  CompetitionReadinessWriteResult,
  DemoDrillResult,
  AttackCaseDataset,
  Overview
} from '../types';
import { externalEventSample, externalBatchEventSample } from '../utils';

export function SettingsPanel({ overview, refresh }: { overview: Overview; refresh: () => Promise<void> }) {
  const [eventJson, setEventJson] = useState(JSON.stringify(externalEventSample, null, 2));
  const [batchJson, setBatchJson] = useState(JSON.stringify(externalBatchEventSample, null, 2));
  const [evaluation, setEvaluation] = useState<SupervisorEvaluation | null>(null);
  const [batchEvaluation, setBatchEvaluation] = useState<SupervisorBatchEvaluation | null>(null);
  const [externalAgentDemo, setExternalAgentDemo] = useState<ExternalAgentDemoResult | null>(null);
  const [attackDataset, setAttackDataset] = useState<AttackCaseDataset | null>(null);
  const [integrationBundle, setIntegrationBundle] = useState<OpenClawIntegrationBundle | null>(null);
  const [demoDrill, setDemoDrill] = useState<DemoDrillResult | null>(null);
  const [openClawPluginPackage, setOpenClawPluginPackage] = useState<OpenClawPluginPackageResult | null>(null);
  const [openClawPluginValidation, setOpenClawPluginValidation] = useState<OpenClawPluginValidationWriteResult | null>(
    null
  );
  const [competitionReadiness, setCompetitionReadiness] = useState<CompetitionReadiness | null>(null);
  const [competitionReadinessOutput, setCompetitionReadinessOutput] = useState<CompetitionReadinessWriteResult | null>(
    null
  );
  const [evaluating, setEvaluating] = useState(false);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [runningExternalAgentDemo, setRunningExternalAgentDemo] = useState(false);
  const [runningDemoDrill, setRunningDemoDrill] = useState(false);
  const [writingOpenClawPlugin, setWritingOpenClawPlugin] = useState(false);
  const [validatingOpenClawPlugin, setValidatingOpenClawPlugin] = useState(false);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [evaluateError, setEvaluateError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchAttackCaseDataset()
        .then(setAttackDataset)
        .catch(() => undefined),
      fetchOpenClawIntegrationBundle()
        .then(setIntegrationBundle)
        .catch(() => undefined),
      fetchDemoDrill()
        .then(setDemoDrill)
        .catch(() => undefined),
      fetchCompetitionReadiness()
        .then(setCompetitionReadiness)
        .catch(() => undefined)
    ]);
  }, []);

  async function handleEvaluateEvent() {
    setEvaluating(true);
    setEvaluateError('');
    try {
      const parsed = JSON.parse(eventJson) as Record<string, unknown>;
      const result = await evaluateSupervisorEvent(parsed);
      setEvaluation(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '事件 JSON 解析或监督接口调用失败');
    } finally {
      setEvaluating(false);
    }
  }

  async function handleBatchEvaluate() {
    setBatchEvaluating(true);
    setEvaluateError('');
    try {
      const parsed = JSON.parse(batchJson) as unknown;
      const events = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { events?: unknown }).events)
          ? (parsed as { events: unknown[] }).events
          : null;
      if (!events) {
        throw new Error('批量事件必须是 JSON 数组，或形如 { "events": [...] } 的对象。');
      }
      const result = await evaluateSupervisorBatch(events as Record<string, unknown>[]);
      setBatchEvaluation(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '批量事件 JSON 解析或监督接口调用失败');
    } finally {
      setBatchEvaluating(false);
    }
  }

  async function handleRunExternalAgentDemo() {
    setRunningExternalAgentDemo(true);
    setEvaluateError('');
    try {
      const result = await runExternalAgentDemo();
      setExternalAgentDemo(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '外部 Agent 演示运行失败');
    } finally {
      setRunningExternalAgentDemo(false);
    }
  }

  async function handleRunDemoDrill() {
    setRunningDemoDrill(true);
    setEvaluateError('');
    try {
      const result = await runDemoDrill();
      setDemoDrill(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '答辩一键演示运行失败');
    } finally {
      setRunningDemoDrill(false);
    }
  }

  async function handleWriteOpenClawPlugin() {
    setWritingOpenClawPlugin(true);
    setEvaluateError('');
    try {
      const result = await writeOpenClawPluginPackage();
      setOpenClawPluginPackage(result);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : 'OpenClaw 插件包生成失败');
    } finally {
      setWritingOpenClawPlugin(false);
    }
  }

  async function handleValidateOpenClawPlugin() {
    setValidatingOpenClawPlugin(true);
    setEvaluateError('');
    try {
      const result = await writeOpenClawPluginValidation();
      setOpenClawPluginValidation(result);
      setOpenClawPluginPackage(result.validation.package);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : 'OpenClaw 插件包验收失败');
    } finally {
      setValidatingOpenClawPlugin(false);
    }
  }

  async function handleRunReadiness() {
    setCheckingReadiness(true);
    setEvaluateError('');
    try {
      const result = await writeCompetitionReadiness();
      setCompetitionReadinessOutput(result);
      setCompetitionReadiness(result.readiness);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '赛前一键体检运行失败');
    } finally {
      setCheckingReadiness(false);
    }
  }

  function loadSingleExternalSample() {
    setEventJson(JSON.stringify(externalEventSample, null, 2));
    setEvaluation(null);
    setEvaluateError('');
  }

  function loadBatchExternalSample() {
    setBatchJson(JSON.stringify(externalBatchEventSample, null, 2));
    setBatchEvaluation(null);
    setEvaluateError('');
  }

  function clearExternalResults() {
    setEvaluation(null);
    setBatchEvaluation(null);
    setExternalAgentDemo(null);
    setOpenClawPluginPackage(null);
    setOpenClawPluginValidation(null);
    setCompetitionReadinessOutput(null);
    setEvaluateError('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Typography.Title level={2}>模型与系统设置</Typography.Title>
      <Tabs
        defaultActiveKey="1"
        size="large"
        items={[
          {
            key: '1',
            label: '🤖 基础配置与成果对齐',
            children: <SettingsBasicsTab overview={overview} />
          },
          {
            key: '2',
            label: '🎯 演示体验与赛前体检',
            children: (
              <DemoReadinessTab
                overview={overview}
                attackDataset={attackDataset}
                demoDrill={demoDrill}
                runningDemoDrill={runningDemoDrill}
                handleRunDemoDrill={handleRunDemoDrill}
                competitionReadiness={competitionReadiness}
                competitionReadinessOutput={competitionReadinessOutput}
                checkingReadiness={checkingReadiness}
                handleRunReadiness={handleRunReadiness}
              />
            )
          },
          {
            key: '3',
            label: '🔗 外部接入与开放集成',
            children: (
              <ExternalIntegrationTab
                integrationBundle={integrationBundle}
                openClawPluginPackage={openClawPluginPackage}
                openClawPluginValidation={openClawPluginValidation}
                writingOpenClawPlugin={writingOpenClawPlugin}
                validatingOpenClawPlugin={validatingOpenClawPlugin}
                handleWriteOpenClawPlugin={handleWriteOpenClawPlugin}
                handleValidateOpenClawPlugin={handleValidateOpenClawPlugin}
              />
            )
          },
          {
            key: '4',
            label: '🛠️ 测试与手工调试',
            children: (
              <SupervisorDebugTab
                externalAgentDemo={externalAgentDemo}
                runningExternalAgentDemo={runningExternalAgentDemo}
                handleRunExternalAgentDemo={handleRunExternalAgentDemo}
                eventJson={eventJson}
                setEventJson={setEventJson}
                batchJson={batchJson}
                setBatchJson={setBatchJson}
                evaluation={evaluation}
                batchEvaluation={batchEvaluation}
                evaluating={evaluating}
                batchEvaluating={batchEvaluating}
                evaluateError={evaluateError}
                handleEvaluateEvent={handleEvaluateEvent}
                handleBatchEvaluate={handleBatchEvaluate}
                loadSingleExternalSample={loadSingleExternalSample}
                loadBatchExternalSample={loadBatchExternalSample}
                clearExternalResults={clearExternalResults}
              />
            )
          }
        ]}
      />
    </div>
  );
}
