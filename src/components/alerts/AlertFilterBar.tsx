import { Flex } from 'antd';
import { riskLabel } from '../../utils';
import { UiButton, UiInput, UiSelect } from '../ui';

interface AlertFilterBarProps {
  query: string;
  severityFilter: string;
  riskScoreFilter: string;
  decisionFilter: string;
  policyFilter: string;
  scenarioFilter: string;
  policies: Array<string | undefined>;
  scenarios: Array<string | undefined>;
  copiedFiltered: boolean;
  onQueryChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
  onRiskScoreFilterChange: (value: string) => void;
  onDecisionFilterChange: (value: string) => void;
  onPolicyFilterChange: (value: string) => void;
  onScenarioFilterChange: (value: string) => void;
  onReset: () => void;
  onCopyFiltered: () => void;
}

export function AlertFilterBar({
  query,
  severityFilter,
  riskScoreFilter,
  decisionFilter,
  policyFilter,
  scenarioFilter,
  policies,
  scenarios,
  copiedFiltered,
  onQueryChange,
  onSeverityFilterChange,
  onRiskScoreFilterChange,
  onDecisionFilterChange,
  onPolicyFilterChange,
  onScenarioFilterChange,
  onReset,
  onCopyFiltered
}: AlertFilterBarProps) {
  return (
    <Flex gap={16} wrap="wrap" className="zh-mb-16">
      <UiInput
        placeholder="剧本、策略、工具、证据"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="zh-filter-control--query"
      />
      <UiSelect
        value={severityFilter}
        onChange={onSeverityFilterChange}
        className="zh-filter-control--sm"
        options={['全部', 'critical', 'high', 'medium', 'low'].map((value) => ({
          label: value === '全部' ? '全部级别' : riskLabel[value],
          value
        }))}
      />
      <UiSelect
        value={riskScoreFilter}
        onChange={onRiskScoreFilterChange}
        className="zh-filter-control--sm"
        options={[
          ['全部', '全部风险分'],
          ['50', '≥ 50'],
          ['70', '≥ 70'],
          ['90', '≥ 90']
        ].map(([value, label]) => ({ label, value }))}
      />
      <UiSelect
        value={decisionFilter}
        onChange={onDecisionFilterChange}
        className="zh-filter-control--sm"
        options={['全部', '拒绝', '询问', '隔离', '允许'].map((value) => ({
          label: value === '全部' ? '全部决策' : value,
          value
        }))}
      />
      <UiSelect
        value={policyFilter}
        onChange={onPolicyFilterChange}
        className="zh-filter-control--md"
        options={['全部', ...policies].map((value) => ({ label: value === '全部' ? '全部策略' : value, value }))}
      />
      <UiSelect
        value={scenarioFilter}
        onChange={onScenarioFilterChange}
        className="zh-filter-control--md"
        options={['全部', ...scenarios].map((value) => ({ label: value === '全部' ? '全部剧本' : value, value }))}
      />
      <div className="zh-flex-spacer" />
      <UiButton onClick={onReset}>重置</UiButton>
      <UiButton onClick={onCopyFiltered}>{copiedFiltered ? '已复制' : '复制当前告警'}</UiButton>
    </Flex>
  );
}
