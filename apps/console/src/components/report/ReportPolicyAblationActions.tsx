import { useState } from 'react';
import { Space, Typography } from 'antd';
import { FileCheck2, RefreshCw } from 'lucide-react';
import { writePolicyAblationEvidence } from '@/api';
import { PanelCard, UiAlert, UiButton } from '../ui';

type ReportPolicyAblationActionsProps = {
  onRefreshReport?: () => Promise<void> | void;
};

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ReportPolicyAblationActions({ onRefreshReport }: ReportPolicyAblationActionsProps) {
  const [writingAblation, setWritingAblation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleWriteAblation() {
    setWritingAblation(true);
    setNotice(null);
    try {
      const result = await writePolicyAblationEvidence();
      await Promise.resolve(onRefreshReport?.());
      setNotice({
        type: 'success',
        message: `策略消融实验已运行并写入证据：${result.summary.experiment_count} 组策略、${result.summary.scenario_count} 个脚本，控制率下降 ${result.summary.control_drop}%。`
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: `策略消融实验运行失败：${errorMessage(error, '未知错误')}`
      });
    } finally {
      setWritingAblation(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      await Promise.resolve(onRefreshReport?.());
      setNotice({ type: 'success', message: '正常任务与策略消融评测已刷新。' });
    } catch (error) {
      setNotice({ type: 'error', message: `刷新失败：${errorMessage(error, '未知错误')}` });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <PanelCard variant="borderless" className="zh-report-action-panel">
      <div className="zh-report-action-row">
        <div className="zh-report-action-copy">
          <Typography.Text strong>正常任务与策略证据补齐</Typography.Text>
          <Typography.Text type="secondary">
            运行策略消融实验，逐组关闭关键防护并复跑 20 个脚本；本地实测约 2 分钟，完成后写入 JSON/Markdown 证据。
          </Typography.Text>
        </div>
        <Space wrap className="zh-report-action-buttons">
          <UiButton
            variant="primary"
            icon={<FileCheck2 size={16} />}
            loading={writingAblation}
            disabled={refreshing}
            onClick={() => {
              void handleWriteAblation();
            }}
          >
            运行策略消融实验
          </UiButton>
          <UiButton
            icon={<RefreshCw size={16} />}
            loading={refreshing}
            disabled={writingAblation}
            onClick={() => {
              void handleRefresh();
            }}
          >
            刷新评测
          </UiButton>
        </Space>
      </div>
      {notice && <UiAlert className="zh-mt-16" type={notice.type} message={notice.message} showIcon />}
    </PanelCard>
  );
}
