import { useState } from 'react';
import { Flex, Typography } from 'antd';
import { Copy } from 'lucide-react';
import { PanelCard, UiButton, UiTabs } from '../components/ui';
import {
  ReportAttackEvaluationTab,
  ReportDeliveryTab,
  ReportNormalEvaluationTab,
  ReportOverviewTab
} from '../components/report';
import { createCleanSubmissionPackage, createSubmissionPackage } from '../api';
import type { ReportData, SubmissionPackageResult } from '../types';
import { writeClipboardText } from '../utils';

export function ReportPanel({
  report,
  onOpenScenario
}: {
  report: ReportData | null;
  onOpenScenario: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState('');
  const [submissionPackage, setSubmissionPackage] = useState<SubmissionPackageResult | null>(null);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [creatingCleanPackage, setCreatingCleanPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  const markdown = report?.markdown ?? '正在加载报告...';
  const competitionPackage = report?.competition_package;
  const packageFiles = competitionPackage?.files ?? [];

  async function copyReport() {
    const ok = await writeClipboardText(markdown);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  async function copyPackageFile(filename: string, content: string) {
    const ok = await writeClipboardText(content);
    if (ok) {
      setCopiedFile(filename);
      window.setTimeout(() => setCopiedFile(''), 1600);
    }
  }

  function downloadPackageFile(filename: string, content: string, contentType: string) {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCreateSubmissionPackage() {
    setCreatingPackage(true);
    setPackageError('');
    try {
      const result = await createSubmissionPackage();
      setSubmissionPackage(result);
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '生成提交包失败');
    } finally {
      setCreatingPackage(false);
    }
  }

  async function handleCreateCleanSubmissionPackage() {
    setCreatingCleanPackage(true);
    setPackageError('');
    try {
      const result = await createCleanSubmissionPackage();
      setSubmissionPackage(result);
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '生成干净提交包失败');
    } finally {
      setCreatingCleanPackage(false);
    }
  }

  return (
    <div className="zh-page-stack">
      <PanelCard variant="borderless">
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} className="zh-title-flush">
            初赛报告材料中心
          </Typography.Title>
          <UiButton icon={<Copy size={16} />} onClick={copyReport}>
            {copied ? '已复制' : '复制 Markdown'}
          </UiButton>
        </Flex>
      </PanelCard>

      {report ? (
        <UiTabs
          defaultActiveKey="1"
          size="large"
          items={[
            {
              key: '1',
              label: '📊 报告概览与成熟度',
              children: <ReportOverviewTab report={report} />
            },
            {
              key: '2',
              label: '🛡️ 攻防实战评测',
              children: <ReportAttackEvaluationTab report={report} onOpenScenario={onOpenScenario} />
            },
            {
              key: '3',
              label: '🚦 正常与消融评测',
              children: <ReportNormalEvaluationTab report={report} />
            },
            {
              key: '4',
              label: '📦 比赛交付与接口',
              children: (
                <ReportDeliveryTab
                  competitionPackage={competitionPackage}
                  packageFiles={packageFiles}
                  markdown={markdown}
                  submissionPackage={submissionPackage}
                  creatingPackage={creatingPackage}
                  creatingCleanPackage={creatingCleanPackage}
                  packageError={packageError}
                  copiedFile={copiedFile}
                  handleCreateSubmissionPackage={handleCreateSubmissionPackage}
                  handleCreateCleanSubmissionPackage={handleCreateCleanSubmissionPackage}
                  copyPackageFile={copyPackageFile}
                  downloadPackageFile={downloadPackageFile}
                />
              )
            }
          ]}
        />
      ) : (
        <PanelCard variant="borderless" style={{ textAlign: 'center', padding: 64 }}>
          <Typography.Text type="secondary">正在加载报告...</Typography.Text>
        </PanelCard>
      )}
    </div>
  );
}
