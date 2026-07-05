import { useState } from 'react';
import { Space, Typography } from 'antd';
import { PlayCircle, RefreshCw } from 'lucide-react';
import { runAttackEffectivenessEvidence } from '@/api';
import { PanelCard, UiAlert, UiButton } from '../ui';

type ReportAttackEvidenceActionsProps = {
  onRefreshReport?: () => Promise<void> | void;
  onRefreshRuntime?: () => Promise<unknown> | void;
};

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function refreshReportData(
  onRefreshReport?: () => Promise<void> | void,
  onRefreshRuntime?: () => Promise<unknown> | void
) {
  await Promise.all([Promise.resolve(onRefreshReport?.()), Promise.resolve(onRefreshRuntime?.())]);
}

export function ReportAttackEvidenceActions({ onRefreshReport, onRefreshRuntime }: ReportAttackEvidenceActionsProps) {
  const [runningEvidence, setRunningEvidence] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleRunEvidence() {
    setRunningEvidence(true);
    setNotice(null);
    try {
      const result = await runAttackEffectivenessEvidence();
      await refreshReportData(onRefreshReport, onRefreshRuntime);
      setNotice({
        type: 'success',
        message: `已完成 ${result.run_result.summary.total} 个脚本的无防护/有防护对照复现，控制率 ${result.run_result.summary.control_rate}%，报告数据已刷新。`
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: `攻防复现运行失败：${errorMessage(error, '未知错误')}`
      });
    } finally {
      setRunningEvidence(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      await refreshReportData(onRefreshReport, onRefreshRuntime);
      setNotice({ type: 'success', message: '报告与运行概览已刷新。' });
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
          <Typography.Text strong>攻防证据补齐</Typography.Text>
          <Typography.Text type="secondary">
            运行全部脚本的无防护攻击复现和有防护监督拦截，生成可用于成果材料的审计日志、告警和 hash 链证据。
          </Typography.Text>
        </div>
        <Space wrap className="zh-report-action-buttons">
          <UiButton
            variant="primary"
            icon={<PlayCircle size={16} />}
            loading={runningEvidence}
            disabled={refreshing}
            onClick={() => {
              void handleRunEvidence();
            }}
          >
            运行全部攻防复现
          </UiButton>
          <UiButton
            icon={<RefreshCw size={16} />}
            loading={refreshing}
            disabled={runningEvidence}
            onClick={() => {
              void handleRefresh();
            }}
          >
            刷新报告
          </UiButton>
        </Space>
      </div>
      {notice && <UiAlert className="zh-mt-16" type={notice.type} message={notice.message} showIcon />}
    </PanelCard>
  );
}
