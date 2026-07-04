import { useEffect, useMemo, useState } from 'react';
import { Database, Play } from 'lucide-react';
import { Col, Row, Space, Typography } from 'antd';
import { fetchAttackTestsets, runAttackTestset } from '../../api';
import type { AttackTestsetSample, AttackTestsetRunResult, AttackTestsetsResponse } from '../../types';
import { PanelCard, UiAlert, UiButton, UiSelect, UiSwitch } from '../ui';
import { AttackTestsetEditorPanel } from './AttackTestsetEditorPanel';
import { AttackTestsetResultsPanel } from './AttackTestsetResultsPanel';
import { attackTestsetFlowSteps } from './labRuntimeFlowPresets';
import { LabRuntimeFlow } from './LabRuntimeFlow';
import { ResultRunButton, RunResultEmptyState } from './RunResultActions';

type PlannerMode = 'fixed' | 'model';

const EMPTY_TESTSETS: AttackTestsetsResponse = {
  version: 'attack-testsets-empty',
  sample_count: 0,
  detectors: {},
  surfaces: []
};

function stringifyOptions(sample?: AttackTestsetSample) {
  return JSON.stringify(sample?.options ?? {}, null, 2);
}

export function AttackTestsetLab() {
  const [testsets, setTestsets] = useState<AttackTestsetsResponse>(EMPTY_TESTSETS);
  const [selectedSurface, setSelectedSurface] = useState('all');
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [editableSampleId, setEditableSampleId] = useState('');
  const [editableAttackInput, setEditableAttackInput] = useState('');
  const [editableOptionsText, setEditableOptionsText] = useState('{}');
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('fixed');
  const [executeInSandbox, setExecuteInSandbox] = useState(true);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<AttackTestsetRunResult | null>(null);

  useEffect(() => {
    fetchAttackTestsets()
      .then(setTestsets)
      .catch((error) => setNotice(`红队测试集加载失败：${error instanceof Error ? error.message : '未知错误'}`));
  }, []);

  const scopedSamples = useMemo(() => {
    const surfaces =
      selectedSurface === 'all'
        ? testsets.surfaces
        : testsets.surfaces.filter((item) => item.surface_id === selectedSurface);
    return surfaces.flatMap((surface) => surface.samples);
  }, [selectedSurface, testsets.surfaces]);

  const runnableSamples = useMemo(() => {
    if (!selectedSampleIds.length) return scopedSamples;
    const selected = new Set(selectedSampleIds);
    return scopedSamples.filter((sample) => selected.has(sample.id));
  }, [scopedSamples, selectedSampleIds]);

  const editableSample = useMemo(
    () => runnableSamples.find((sample) => sample.id === editableSampleId) ?? runnableSamples[0],
    [editableSampleId, runnableSamples]
  );

  const sampleOptions = useMemo(
    () =>
      scopedSamples.map((sample) => ({
        label: `${sample.id} ${sample.title}`,
        value: sample.id
      })),
    [scopedSamples]
  );

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      if (!editableSample) {
        setEditableSampleId('');
        setEditableAttackInput('');
        setEditableOptionsText('{}');
        return;
      }
      if (editableSample.id !== editableSampleId) {
        setEditableSampleId(editableSample.id);
        setEditableAttackInput(editableSample.attack_input);
        setEditableOptionsText(stringifyOptions(editableSample));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editableSample, editableSampleId]);

  function loadSampleIntoEditor(sampleId: string) {
    const sample = scopedSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setEditableSampleId(sample.id);
    setEditableAttackInput(sample.attack_input);
    setEditableOptionsText(stringifyOptions(sample));
  }

  function parseEditableOptions() {
    const parsed = JSON.parse(editableOptionsText || '{}') as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('工具参数必须是 JSON 对象');
    }
    return parsed as Record<string, unknown>;
  }

  async function runTestset(sampleIds = selectedSampleIds) {
    setRunning(true);
    setNotice('');
    try {
      const sampleOverrides = editableSampleId
        ? {
            [editableSampleId]: {
              attack_input: editableAttackInput,
              options: parseEditableOptions()
            }
          }
        : undefined;
      setResult(
        await runAttackTestset({
          surface_id: selectedSurface,
          sample_ids: sampleIds,
          sample_overrides: sampleOverrides,
          execute_in_sandbox: executeInSandbox,
          planner_mode: plannerMode,
          force_real_model: plannerMode === 'model'
        })
      );
    } catch (error) {
      setNotice(`红队测试集运行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="zh-attack-lab">
      {notice && <UiAlert type="warning" showIcon title={notice} className="zh-mb-24" />}
      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} xl={7}>
          <PanelCard title="红队测试集" subtitle={`${testsets.sample_count} 条样本`} className="zh-full-height">
            <Space orientation="vertical" size={16} className="zh-full-width">
              <UiAlert
                type="info"
                showIcon
                message="测试集会批量运行本地靶场样本，并用检测器判断攻击是否复现、监督器是否控制。"
              />
              <LabRuntimeFlow compact steps={attackTestsetFlowSteps(selectedSurface, plannerMode)} />
              <div className="zh-attack-lab__field">
                <Typography.Text strong>攻击面范围</Typography.Text>
                <UiSelect
                  value={selectedSurface}
                  onChange={(value) => {
                    setSelectedSurface(String(value));
                    setSelectedSampleIds([]);
                    setResult(null);
                  }}
                  options={[
                    { label: '全部攻击面', value: 'all' },
                    ...testsets.surfaces.map((surface) => ({
                      label: `${surface.name} (${surface.sample_count})`,
                      value: surface.surface_id
                    }))
                  ]}
                />
              </div>
              <div className="zh-attack-lab__field">
                <Typography.Text strong>样本筛选</Typography.Text>
                <UiSelect
                  mode="multiple"
                  value={selectedSampleIds}
                  allowClear
                  placeholder="留空表示运行当前范围全部样本"
                  onChange={(value) => {
                    setSelectedSampleIds(value.map(String));
                    setResult(null);
                  }}
                  options={sampleOptions}
                />
              </div>
              {editableSample && (
                <AttackTestsetEditorPanel
                  editableSample={editableSample}
                  runnableSamples={runnableSamples}
                  editableAttackInput={editableAttackInput}
                  editableOptionsText={editableOptionsText}
                  onSampleChange={loadSampleIntoEditor}
                  onAttackInputChange={setEditableAttackInput}
                  onOptionsTextChange={setEditableOptionsText}
                />
              )}
              <div className="zh-attack-lab__field">
                <Typography.Text strong>工具规划方式</Typography.Text>
                <UiSelect
                  value={plannerMode}
                  onChange={(value) => setPlannerMode(value as PlannerMode)}
                  options={[
                    { label: '本地批量规划（快速覆盖全部样本）', value: 'fixed' },
                    { label: '真实模型规划（适合单样本复现）', value: 'model' }
                  ]}
                />
              </div>
              <div className="zh-attack-lab__switch-row">
                <div>
                  <Typography.Text strong>沙箱执行</Typography.Text>
                  <Typography.Paragraph type="secondary" className="zh-attack-lab__hint">
                    所有样本只触碰项目本地靶场资产。
                  </Typography.Paragraph>
                </div>
                <UiSwitch checked={executeInSandbox} onChange={setExecuteInSandbox} />
              </div>
              <Space wrap>
                <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={() => runTestset()}>
                  运行当前范围
                </UiButton>
                <UiButton
                  icon={<Play size={16} />}
                  loading={running}
                  disabled={!editableSampleId}
                  onClick={() => runTestset(editableSampleId ? [editableSampleId] : [])}
                >
                  只运行编辑样本
                </UiButton>
              </Space>
            </Space>
          </PanelCard>
        </Col>

        <Col xs={24} xl={17}>
          <PanelCard
            title="测试集结果"
            subtitle={result ? `${result.sample_count} 条样本已运行` : '等待运行'}
            className="zh-full-height"
            extra={
              <Space size={8} wrap>
                <ResultRunButton
                  hasResult={Boolean(result)}
                  idleLabel="运行范围"
                  rerunLabel="重新运行"
                  loading={running}
                  onClick={() => runTestset()}
                />
                <UiButton
                  size="small"
                  icon={<Play size={14} />}
                  loading={running}
                  disabled={!editableSampleId}
                  onClick={() => runTestset(editableSampleId ? [editableSampleId] : [])}
                >
                  编辑样本
                </UiButton>
              </Space>
            }
          >
            {result ? (
              <AttackTestsetResultsPanel result={result} />
            ) : (
              <RunResultEmptyState
                icon={<Database size={28} />}
                title="等待批量运行测试集"
                description="会逐条调用后端样本、检测器和监督器，输出复现率、检测命中率、防护控制率和审计编号。"
                actionLabel="运行当前范围"
                loading={running}
                onAction={() => runTestset()}
                extraActions={
                  <Space size={8} wrap className="zh-attack-lab__empty-actions">
                    <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={() => runTestset()}>
                      运行当前范围
                    </UiButton>
                    <UiButton
                      icon={<Play size={16} />}
                      loading={running}
                      disabled={!editableSampleId}
                      onClick={() => runTestset(editableSampleId ? [editableSampleId] : [])}
                    >
                      只运行编辑样本
                    </UiButton>
                  </Space>
                }
              />
            )}
          </PanelCard>
        </Col>
      </Row>
    </div>
  );
}
