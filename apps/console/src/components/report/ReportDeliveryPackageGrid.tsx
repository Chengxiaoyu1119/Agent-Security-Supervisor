import { useMemo, useState } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { Copy, Download, FileText, RotateCcw, Search } from 'lucide-react';
import type { ReportData } from '@/types';
import { LabelTag, PanelCard, UiButton, UiInput, UiSelect } from '../ui';

type PackageFile = NonNullable<ReportData['competition_package']>['files'][number];

type ReportDeliveryPackageGridProps = {
  packageFiles: PackageFile[];
  copiedFile: string;
  copyPackageFile: (filename: string, content: string) => void | Promise<void>;
  downloadPackageFile: (filename: string, content: string, contentType: string) => void;
};

function fileType(file: PackageFile) {
  const extension = file.filename.split('.').pop()?.toLowerCase() ?? 'file';
  if (extension === 'md') return 'Markdown';
  if (extension === 'json') return 'JSON';
  return extension.toUpperCase();
}

export function ReportDeliveryPackageGrid({
  packageFiles,
  copiedFile,
  copyPackageFile,
  downloadPackageFile
}: ReportDeliveryPackageGridProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部类型');
  const typeOptions = useMemo(
    () => [
      { label: '全部类型', value: '全部类型' },
      ...Array.from(new Set(packageFiles.map(fileType))).map((type) => ({ label: type, value: type }))
    ],
    [packageFiles]
  );
  const filteredFiles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return packageFiles.filter((file) => {
      const text = [file.title, file.filename, file.description, file.content_type].join(' ').toLowerCase();
      return (!keyword || text.includes(keyword)) && (typeFilter === '全部类型' || fileType(file) === typeFilter);
    });
  }, [packageFiles, query, typeFilter]);

  return (
    <>
      <div className="zh-report-filter-toolbar zh-mb-16">
        <div className="zh-report-filter-copy">
          <Typography.Text strong>交付材料检索</Typography.Text>
          <Typography.Text type="secondary">
            每份材料都来自后端生成的报告、样本集、脚本证据或接口说明，可复制也可直接下载。
          </Typography.Text>
        </div>
        <div className="zh-report-filter-controls zh-report-filter-controls--compact">
          <UiInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、文件名、说明"
            prefix={<Search size={14} />}
          />
          <UiSelect value={typeFilter} options={typeOptions} onChange={(value) => setTypeFilter(value)} />
          <UiButton
            icon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery('');
              setTypeFilter('全部类型');
            }}
          >
            重置
          </UiButton>
        </div>
      </div>

      <Row gutter={[16, 16]} className="zh-delivery-package-grid">
        {filteredFiles.map((file) => (
          <Col xs={24} md={12} xl={8} key={file.filename}>
            <PanelCard type="inner" className="zh-delivery-package-card zh-full-height">
              <div className="zh-delivery-package-card__body">
                <div className="zh-delivery-package-card__head">
                  <Space size={8} align="center">
                    <FileText size={16} />
                    <Typography.Text strong>{file.title}</Typography.Text>
                  </Space>
                  <Space size={6}>
                    <LabelTag variant="filled">{fileType(file)}</LabelTag>
                    <Typography.Text type="secondary" className="zh-text-sm">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </Typography.Text>
                  </Space>
                </div>
                <Typography.Paragraph type="secondary" className="zh-delivery-package-card__desc">
                  {file.description}
                </Typography.Paragraph>
                <Typography.Text code className="zh-code-break zh-delivery-package-card__filename">
                  {file.filename}
                </Typography.Text>
              </div>
              <div className="zh-delivery-package-card__actions">
                <UiButton type="text" size="small" onClick={() => copyPackageFile(file.filename, file.content)}>
                  <Copy size={14} /> {copiedFile === file.filename ? '已复制' : '复制'}
                </UiButton>
                <UiButton
                  type="text"
                  size="small"
                  onClick={() => downloadPackageFile(file.filename, file.content, file.content_type)}
                >
                  <Download size={14} /> 下载
                </UiButton>
              </div>
            </PanelCard>
          </Col>
        ))}
      </Row>

      {!filteredFiles.length && <div className="zh-empty-panel">没有匹配的材料文件。</div>}
    </>
  );
}
