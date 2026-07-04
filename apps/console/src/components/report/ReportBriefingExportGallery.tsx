import { useEffect, useMemo, useState } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { FileDown, FileImage, FileText, RefreshCw } from 'lucide-react';
import { fetchBriefingSheetExports, writeBriefingSheetExports, writeProjectRoadmapEvidence } from '@/api';
import type { BriefingSheetExportResult } from '@/app/reportEvaluationApi';
import { LabelTag, MetricCard as Metric, PanelCard, SectionTitle, UiAlert, UiButton } from '../ui';

const surfaceNameMap: Record<string, string> = {
  'prompt-injection': '提示注入',
  jailbreak: '模型越狱',
  'data-leakage': '内容泄露',
  'abuse-risk': '滥用风险',
  'tool-hijack': '工具调用劫持',
  'memory-poison': '记忆中毒',
  'environment-pollution': '环境感知污染'
};

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function fileUrl(surfaceId: string, fileFormat: 'png' | 'pdf') {
  return `/api/attack_surfaces/briefing_sheets/export/files/${encodeURIComponent(surfaceId)}.${fileFormat}`;
}

export function ReportBriefingExportGallery() {
  const [data, setData] = useState<BriefingSheetExportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const files = useMemo(() => data?.export.files ?? [], [data]);

  async function refreshExports(showNotice = false) {
    setLoading(true);
    try {
      const result = await fetchBriefingSheetExports();
      setData(result);
      if (showNotice) {
        setNotice({ type: 'success', message: '答辩单页导出清单已刷新。' });
      }
    } catch (error) {
      setNotice({ type: 'error', message: `读取导出清单失败：${errorMessage(error, '未知错误')}` });
    } finally {
      setLoading(false);
    }
  }

  async function runExport() {
    setRunning(true);
    setNotice(null);
    try {
      const result = await writeBriefingSheetExports('both');
      await writeProjectRoadmapEvidence();
      setData(result);
      if (!result.ok) {
        throw new Error(result.reason || '导出脚本执行失败');
      }
      setNotice({
        type: 'success',
        message: `已生成 ${result.summary.png_count} 个 PNG 和 ${result.summary.pdf_count} 个 PDF，可直接逐项预览。`
      });
    } catch (error) {
      setNotice({ type: 'error', message: `导出答辩单页失败：${errorMessage(error, '未知错误')}` });
    } finally {
      setRunning(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialExports() {
      try {
        const result = await fetchBriefingSheetExports();
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({ type: 'error', message: `读取导出清单失败：${errorMessage(error, '未知错误')}` });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialExports();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PanelCard
      title={
        <SectionTitle
          title="答辩单页 PNG/PDF"
          meta={data?.ok ? `${files.length} 类攻击面已导出` : '从页面触发真实后端导出'}
        />
      }
      variant="borderless"
    >
      <Row gutter={[16, 16]} className="zh-mb-24">
        <Col xs={24} sm={12} lg={6}>
          <Metric label="PNG 文件" value={`${data?.summary.png_count ?? 0}`} tone="cyan" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Metric label="PDF 文件" value={`${data?.summary.pdf_count ?? 0}`} tone="green" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Metric label="攻击面覆盖" value={`${data?.summary.exported_surface_count ?? 0}/7`} tone="amber" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Metric label="HTML 源文件" value={`${data?.summary.html_file_count ?? 0}`} tone="red" />
        </Col>
      </Row>

      <div className="zh-brief-export-toolbar">
        <div className="zh-brief-export-copy">
          <Typography.Text strong>真实导出文件清单</Typography.Text>
          <Typography.Text type="secondary">
            点击导出会调用后端生成 7 类攻击面的 HTML，再由本机浏览器内核转换成 PNG/PDF，不是前端假数据。
          </Typography.Text>
        </div>
        <Space wrap className="zh-brief-export-actions">
          <UiButton
            variant="primary"
            icon={<FileDown size={16} />}
            loading={running}
            disabled={loading}
            onClick={() => {
              void runExport();
            }}
          >
            重新导出全部
          </UiButton>
          <UiButton
            icon={<RefreshCw size={16} />}
            loading={loading && !running}
            disabled={running}
            onClick={() => {
              void refreshExports(true);
            }}
          >
            刷新清单
          </UiButton>
          <UiButton href="/api/attack_surfaces/briefing_sheets/export.md" target="_blank">
            打开导出报告
          </UiButton>
        </Space>
      </div>

      {notice && <UiAlert className="zh-mt-16" type={notice.type} message={notice.message} showIcon />}

      {files.length ? (
        <Row gutter={[16, 16]} className="zh-mt-16 zh-brief-export-grid">
          {files.map((file) => {
            const surfaceName = surfaceNameMap[file.surface_id] ?? file.surface_id;
            return (
              <Col xs={24} md={12} xl={8} key={file.surface_id}>
                <PanelCard
                  type="inner"
                  className="zh-brief-export-card zh-full-height"
                  title={
                    <Space size={8} wrap>
                      <Typography.Text strong>{surfaceName}</Typography.Text>
                      <LabelTag>{file.surface_id}</LabelTag>
                    </Space>
                  }
                >
                  <Typography.Text type="secondary" className="zh-text-body zh-text-block zh-brief-export-desc">
                    可直接打开 PNG 放入答辩 PPT，也可打开 PDF 用于打印、归档或提交材料预览。
                  </Typography.Text>
                  <Space wrap className="zh-brief-export-file-actions">
                    <UiButton
                      size="small"
                      icon={<FileImage size={14} />}
                      href={file.png_path ? fileUrl(file.surface_id, 'png') : undefined}
                      target="_blank"
                      disabled={!file.png_path}
                    >
                      预览 PNG
                    </UiButton>
                    <UiButton
                      size="small"
                      icon={<FileText size={14} />}
                      href={file.pdf_path ? fileUrl(file.surface_id, 'pdf') : undefined}
                      target="_blank"
                      disabled={!file.pdf_path}
                    >
                      打开 PDF
                    </UiButton>
                  </Space>
                </PanelCard>
              </Col>
            );
          })}
        </Row>
      ) : (
        <div className="zh-empty-panel">
          {loading ? '正在读取导出清单...' : '还没有 PNG/PDF 文件，点击“重新导出全部”即可生成。'}
        </div>
      )}
    </PanelCard>
  );
}
