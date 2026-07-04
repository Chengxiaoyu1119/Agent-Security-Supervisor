import { Space, Typography } from 'antd';
import type { AttackTestsetSample } from '../../types';
import { PanelCard, UiInput, UiSelect } from '../ui';

type AttackTestsetEditorPanelProps = {
  editableSample: AttackTestsetSample;
  runnableSamples: AttackTestsetSample[];
  editableAttackInput: string;
  editableOptionsText: string;
  onSampleChange: (sampleId: string) => void;
  onAttackInputChange: (value: string) => void;
  onOptionsTextChange: (value: string) => void;
};

export function AttackTestsetEditorPanel({
  editableSample,
  runnableSamples,
  editableAttackInput,
  editableOptionsText,
  onSampleChange,
  onAttackInputChange,
  onOptionsTextChange
}: AttackTestsetEditorPanelProps) {
  return (
    <PanelCard title="当前样本可编辑" subtitle={editableSample.id} type="inner">
      <Space orientation="vertical" size={12} className="zh-full-width">
        <div className="zh-attack-lab__field">
          <Typography.Text strong>正在编辑的样本</Typography.Text>
          <UiSelect
            value={editableSample.id}
            onChange={(value) => onSampleChange(String(value))}
            options={runnableSamples.map((sample) => ({
              label: `${sample.id} ${sample.title}`,
              value: sample.id
            }))}
          />
        </div>
        <div className="zh-attack-lab__field">
          <Typography.Text strong>攻击输入</Typography.Text>
          <UiInput.TextArea
            value={editableAttackInput}
            onChange={(event) => onAttackInputChange(event.target.value)}
            rows={5}
            showCount
            maxLength={12000}
          />
        </div>
        <div className="zh-attack-lab__field">
          <Typography.Text strong>工具参数 JSON</Typography.Text>
          <UiInput.TextArea
            value={editableOptionsText}
            onChange={(event) => onOptionsTextChange(event.target.value)}
            rows={4}
            spellCheck={false}
          />
        </div>
        <Typography.Text type="secondary" className="zh-attack-lab__hint">
          批量运行时只覆盖当前编辑样本，其余样本使用测试集原始参数。
        </Typography.Text>
      </Space>
    </PanelCard>
  );
}
