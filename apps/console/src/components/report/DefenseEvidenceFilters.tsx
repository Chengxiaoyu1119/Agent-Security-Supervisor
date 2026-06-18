import { Space, Typography } from 'antd';
import { UiButton, UiInput, UiSelect } from '../ui';

interface DefenseEvidenceFiltersProps {
  query: string;
  surfaceFilter: string;
  evidenceFilter: string;
  surfaces: string[];
  onQueryChange: (value: string) => void;
  onSurfaceFilterChange: (value: string) => void;
  onEvidenceFilterChange: (value: string) => void;
  onReset: () => void;
}

export function DefenseEvidenceFilters({
  query,
  surfaceFilter,
  evidenceFilter,
  surfaces,
  onQueryChange,
  onSurfaceFilterChange,
  onEvidenceFilterChange,
  onReset
}: DefenseEvidenceFiltersProps) {
  return (
    <Space wrap className="zh-defense-evidence-filters">
      <Space orientation="vertical" size={2}>
        <Typography.Text type="secondary" className="zh-filter-label">
          搜索
        </Typography.Text>
        <UiInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="剧本、策略、工具"
          className="zh-filter-input-md"
        />
      </Space>
      <Space orientation="vertical" size={2}>
        <Typography.Text type="secondary" className="zh-filter-label">
          攻击面
        </Typography.Text>
        <UiSelect value={surfaceFilter} onChange={onSurfaceFilterChange} className="zh-filter-select-lg">
          <UiSelect.Option value="全部">全部</UiSelect.Option>
          {surfaces.map((surface) => (
            <UiSelect.Option key={surface} value={surface}>
              {surface}
            </UiSelect.Option>
          ))}
        </UiSelect>
      </Space>
      <Space orientation="vertical" size={2}>
        <Typography.Text type="secondary" className="zh-filter-label">
          证据状态
        </Typography.Text>
        <UiSelect value={evidenceFilter} onChange={onEvidenceFilterChange} className="zh-filter-select-sm">
          <UiSelect.Option value="全部">全部</UiSelect.Option>
          <UiSelect.Option value="高风险">高风险</UiSelect.Option>
          <UiSelect.Option value="已控制">已控制</UiSelect.Option>
          <UiSelect.Option value="缺证据">缺证据</UiSelect.Option>
          <UiSelect.Option value="hash待验">hash待验</UiSelect.Option>
        </UiSelect>
      </Space>
      <UiButton className="zh-defense-evidence-reset" onClick={onReset}>
        清空筛选
      </UiButton>
    </Space>
  );
}
