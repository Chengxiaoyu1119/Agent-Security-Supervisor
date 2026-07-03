import { Col, Flex, Row, Typography } from 'antd';
import { ApprovalReviewQueue } from '../components/audit/ApprovalReviewQueue';
import { AuditFilterBar } from '../components/audit/AuditFilterBar';
import { AuditLogDetail } from '../components/audit/AuditLogDetail';
import { AuditLogList } from '../components/audit/AuditLogList';
import { AuditSummaryCards } from '../components/audit/AuditSummaryCards';
import { useAuditLogViewModel } from '../components/audit/useAuditLogViewModel';
import { PanelCard, UiButton } from '../components/ui';
import type { AuditLog } from '../types';

export function AuditLogPanel({ logs, refresh }: { logs: AuditLog[]; refresh: () => void | Promise<void> }) {
  const view = useAuditLogViewModel({ logs, refresh });

  return (
    <div className="zh-page-stack">
      <PanelCard variant="borderless">
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} className="zh-title-flush">
            工具调用、代码执行、文件访问审计
          </Typography.Title>
          <UiButton onClick={refresh}>刷新审计</UiButton>
        </Flex>
      </PanelCard>

      <AuditSummaryCards
        total={logs.length}
        controlledCount={view.controlledCount}
        highRiskCount={view.highRiskCount}
        executedCount={view.executedCount}
      />

      <ApprovalReviewQueue
        queue={view.approvalQueue}
        reviews={view.latestReviews}
        loading={view.approvalLoading}
        error={view.approvalError}
        busyId={view.approvalBusyId}
        copiedApprovalId={view.copiedApprovalId}
        onRefresh={view.loadApprovalReviews}
        onDecision={view.handleApprovalDecision}
        onCopy={view.copyApprovalEvidence}
      />

      <PanelCard variant="borderless">
        {view.activeAuditLinkId ? (
          <div className="zh-audit-locator">
            <Typography.Text type="secondary">正在定位</Typography.Text>
            <Typography.Text code>{view.activeAuditLinkId}</Typography.Text>
          </div>
        ) : null}

        <AuditFilterBar
          query={view.query}
          decisionFilter={view.decisionFilter}
          riskFilter={view.riskFilter}
          riskScoreFilter={view.riskScoreFilter}
          toolFilter={view.toolFilter}
          executionFilter={view.executionFilter}
          tools={view.tools}
          copiedFiltered={view.copiedFiltered}
          onQueryChange={view.setQuery}
          onDecisionFilterChange={view.setDecisionFilter}
          onRiskFilterChange={view.setRiskFilter}
          onRiskScoreFilterChange={view.setRiskScoreFilter}
          onToolFilterChange={view.setToolFilter}
          onExecutionFilterChange={view.setExecutionFilter}
          onReset={view.resetAuditFilters}
          onCopyFiltered={view.copyFilteredAuditEvidence}
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <AuditLogList
              logs={view.filteredLogs}
              selectedLogId={view.selectedLog?.id}
              onSelectLog={view.setSelectedLogId}
            />
          </Col>
          <Col xs={24} md={14}>
            <AuditLogDetail log={view.selectedLog} copied={view.copied} onCopy={view.copyEvidence} />
          </Col>
        </Row>
      </PanelCard>
    </div>
  );
}
