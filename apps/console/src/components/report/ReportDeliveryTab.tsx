import { Col, Descriptions, Row, Space, Typography } from 'antd';
import { Copy, FileWarning } from 'lucide-react';
import { EvidenceCodeBlock, MetricCard as Metric, PanelCard, SectionTitle, UiAlert, UiBadge, UiButton } from '../ui';
import type { ReportData, SubmissionPackageResult } from '@/types';

type ReportDeliveryTabProps = {
  competitionPackage: ReportData['competition_package'];
  packageFiles: NonNullable<ReportData['competition_package']>['files'];
  markdown: string;
  submissionPackage: SubmissionPackageResult | null;
  creatingPackage: boolean;
  creatingCleanPackage: boolean;
  packageError: string;
  copiedFile: string;
  handleCreateSubmissionPackage: () => void | Promise<void>;
  handleCreateCleanSubmissionPackage: () => void | Promise<void>;
  copyPackageFile: (filename: string, content: string) => void | Promise<void>;
  downloadPackageFile: (filename: string, content: string, contentType: string) => void;
};

export function ReportDeliveryTab({
  competitionPackage,
  packageFiles,
  markdown,
  submissionPackage,
  creatingPackage,
  creatingCleanPackage,
  packageError,
  copiedFile,
  handleCreateSubmissionPackage,
  handleCreateCleanSubmissionPackage,
  copyPackageFile,
  downloadPackageFile
}: ReportDeliveryTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      {competitionPackage && (
        <PanelCard
          title={
            <SectionTitle
              title="比赛交付材料包"
              meta={`${competitionPackage.summary.file_count} 份材料 / ${competitionPackage.summary.alert_count} 条告警证据`}
            />
          }
          variant="borderless"
        >
          <UiAlert
            type="info"
            showIcon
            title="一键生成初赛提交包"
            description="普通包使用当前历史记录；干净包会重新跑固定攻防对照，更适合最终提交。"
            action={
              <Space orientation="vertical">
                <UiButton
                  type="primary"
                  onClick={handleCreateCleanSubmissionPackage}
                  disabled={creatingCleanPackage || creatingPackage}
                  loading={creatingCleanPackage}
                  icon={<FileWarning size={14} />}
                >
                  生成干净提交包
                </UiButton>
                <UiButton
                  onClick={handleCreateSubmissionPackage}
                  disabled={creatingPackage || creatingCleanPackage}
                  loading={creatingPackage}
                  icon={<FileWarning size={14} />}
                >
                  生成普通提交包
                </UiButton>
              </Space>
            }
            className="zh-mb-24"
          />

          {packageError && <UiAlert type="error" title={packageError} className="zh-mb-24" />}

          {submissionPackage && (
            <PanelCard type="inner" className="zh-success-panel zh-mb-24" variant="borderless">
              <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                <Descriptions.Item label="提交包目录">
                  <Typography.Text code>{submissionPackage.package_dir}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Zip 文件">
                  <Typography.Text code>{submissionPackage.zip_path}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="文件数量">
                  <Typography.Text strong>{submissionPackage.file_count}</Typography.Text>
                </Descriptions.Item>
                {submissionPackage.clean_summary && (
                  <Descriptions.Item label="干净运行">
                    <Typography.Text strong>
                      {submissionPackage.clean_summary.clean_run_count} (控制率{' '}
                      {submissionPackage.clean_summary.clean_control_rate}%)
                    </Typography.Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </PanelCard>
          )}

          <Row gutter={[16, 16]} className="zh-mb-24">
            <Col span={6}>
              <Metric
                label="可演示攻击面"
                value={`${competitionPackage.summary.demo_ready_surface_count}/7`}
                tone="green"
              />
            </Col>
            <Col span={6}>
              <Metric label="材料文件" value={`${competitionPackage.summary.file_count}`} tone="cyan" />
            </Col>
            <Col span={6}>
              <Metric label="实验记录" value={`${competitionPackage.summary.run_count}`} tone="amber" />
            </Col>
            <Col span={6}>
              <Metric label="控制率" value={`${competitionPackage.summary.control_rate}%`} tone="red" />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {packageFiles.map((file) => (
              <Col xs={24} md={12} xl={8} key={file.filename}>
                <PanelCard
                  type="inner"
                  title={file.title}
                  extra={
                    <Typography.Text type="secondary" className="zh-text-meta">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </Typography.Text>
                  }
                  actions={[
                    <UiButton type="text" size="small" onClick={() => copyPackageFile(file.filename, file.content)}>
                      <Copy size={14} /> {copiedFile === file.filename ? '已复制' : '复制'}
                    </UiButton>,
                    <UiButton
                      type="text"
                      size="small"
                      onClick={() => downloadPackageFile(file.filename, file.content, file.content_type)}
                    >
                      下载
                    </UiButton>
                  ]}
                >
                  <Typography.Paragraph type="secondary" className="zh-min-h-44">
                    {file.description}
                  </Typography.Paragraph>
                  <Typography.Text code>{file.filename}</Typography.Text>
                </PanelCard>
              </Col>
            ))}
          </Row>
        </PanelCard>
      )}
      {competitionPackage && (
        <PanelCard
          title={<SectionTitle title="赛题要求逐条检查" meta={`${competitionPackage.checklist.length} 条验收项`} />}
          variant="borderless"
        >
          <div className="zh-column-stack">
            {competitionPackage.checklist.map((item, idx) => (
              <div key={idx} className="zh-checklist-item">
                <div className="zh-pt-2">
                  <UiBadge status={item.status === '满足' ? 'success' : 'processing'} text={item.status} />
                </div>
                <div className="zh-flex-spacer">
                  <div>
                    <Typography.Text strong>{item.requirement}</Typography.Text>
                  </div>
                  <div className="zh-mt-4">
                    <Typography.Text type="secondary">{item.evidence}</Typography.Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}
      {competitionPackage && (
        <PanelCard
          title={<SectionTitle title="OpenClaw / 通用智能体适配接口" meta="工具调用事件 -> 监督决策" />}
          variant="borderless"
        >
          <EvidenceCodeBlock>{JSON.stringify(competitionPackage.adapter_schema, null, 2)}</EvidenceCodeBlock>
        </PanelCard>
      )}
      <PanelCard title="Markdown 导出内容" variant="borderless">
        <EvidenceCodeBlock maxHeight="large">{markdown}</EvidenceCodeBlock>
      </PanelCard>
    </Space>
  );
}
