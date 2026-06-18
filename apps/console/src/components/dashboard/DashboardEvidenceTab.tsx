import { Flex, Typography } from 'antd';
import { ScrollText } from 'lucide-react';
import { PanelCard, UiAlert, UiButton } from '../ui';
import { SurfaceEvidenceIndexBoard } from '../surface/SurfaceEvidenceIndexBoard';
import type { AttackSurface, SurfaceEvidencePackIndex, SurfaceEvidencePackWriteResult } from '@/types';

type DashboardEvidenceTabProps = {
  allPackExportResult: SurfaceEvidencePackWriteResult | null;
  allPackExportError: string;
  allPackExporting: boolean;
  handleExportAllSurfacePacks: () => void;
  surfacePackIndex: SurfaceEvidencePackIndex | null;
  surfacePackIndexLoading: boolean;
  surfacePackIndexError: string;
  selectedSurface?: AttackSurface;
  setRiskFilter: (value: string) => void;
  setSurfaceQuery: (value: string) => void;
  setSelectedSurfaceId: (id: string) => void;
};

export function DashboardEvidenceTab({
  allPackExportResult,
  allPackExportError,
  allPackExporting,
  handleExportAllSurfacePacks,
  surfacePackIndex,
  surfacePackIndexLoading,
  surfacePackIndexError,
  selectedSurface,
  setRiskFilter,
  setSurfaceQuery,
  setSelectedSurfaceId
}: DashboardEvidenceTabProps) {
  return (
    <div className="zh-page-stack zh-mt-8">
      <PanelCard variant="borderless" bodyPadding="16px 24px">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Typography.Text strong>证据包管理与导出</Typography.Text>
          <UiButton
            icon={<ScrollText size={16} />}
            onClick={handleExportAllSurfacePacks}
            loading={allPackExporting}
            type="primary"
          >
            生成并导出全部证据包
          </UiButton>
        </Flex>
      </PanelCard>

      {(allPackExportResult || allPackExportError) && (
        <UiAlert
          title={allPackExportError ? '导出失败' : '全部攻击面证据包已生成'}
          description={
            allPackExportError ||
            `${allPackExportResult?.surface_count} 类攻击面 / ${allPackExportResult?.file_count} 个文件 / 缺口 ${allPackExportResult?.summary.gap_count} 项。路径: ${allPackExportResult?.output_dir}`
          }
          type={allPackExportError ? 'error' : 'success'}
          showIcon
        />
      )}

      <SurfaceEvidenceIndexBoard
        index={surfacePackIndex}
        loading={surfacePackIndexLoading}
        error={surfacePackIndexError}
        selectedSurfaceId={selectedSurface?.id ?? ''}
        onSelectSurface={(id) => {
          setRiskFilter('全部');
          setSurfaceQuery('');
          setSelectedSurfaceId(id);
        }}
      />
    </div>
  );
}
