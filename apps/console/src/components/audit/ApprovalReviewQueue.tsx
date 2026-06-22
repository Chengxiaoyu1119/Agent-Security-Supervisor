import { Col, Row, Space, Statistic, Typography } from 'antd';
import type { ApprovalReview, ApprovalReviewList } from '@/types';
import { LabelTag, PanelCard, UiButton } from '../ui';

interface ApprovalReviewQueueProps {
  queue: ApprovalReviewList;
  reviews: ApprovalReview[];
  loading: boolean;
  error: string;
  busyId: string;
  copiedApprovalId: string;
  onRefresh: () => void;
  onDecision: (review: ApprovalReview, action: 'approve' | 'reject') => void;
  onCopy: (review: ApprovalReview) => void;
}

function approvalStatusColor(status: ApprovalReview['status']) {
  if (status === '待复核') return 'processing';
  if (status === '已批准') return 'success';
  return 'error';
}

export function ApprovalReviewQueue({
  queue,
  reviews,
  loading,
  error,
  busyId,
  copiedApprovalId,
  onRefresh,
  onDecision,
  onCopy
}: ApprovalReviewQueueProps) {
  return (
    <PanelCard
      title="人工复核队列"
      extra={
        <UiButton onClick={onRefresh} loading={loading}>
          刷新队列
        </UiButton>
      }
      variant="borderless"
    >
      <Row gutter={[16, 16]} className="zh-mb-16">
        <Col span={6}>
          <Statistic title="待复核" value={queue.summary.pending_count} />
        </Col>
        <Col span={6}>
          <Statistic title="已批准" value={queue.summary.approved_count} />
        </Col>
        <Col span={6}>
          <Statistic title="已驳回" value={queue.summary.rejected_count} />
        </Col>
        <Col span={6}>
          <Statistic title="hash 有效" value={`${queue.summary.hash_valid_count}/${queue.summary.total}`} />
        </Col>
        <Col span={6}>
          <Statistic title="SLA 超时" value={queue.summary.sla_breached_count ?? 0} />
        </Col>
      </Row>
      {error ? (
        <Typography.Text type="danger" className="zh-text-block zh-mb-12">
          {error}
        </Typography.Text>
      ) : null}
      <div className="zh-column-stack">
        {reviews.map((review) => (
          <div key={review.id} className="zh-report-list-item">
            <div>
              <Space>
                <LabelTag variant="filled" color={approvalStatusColor(review.status)}>
                  {review.status}
                </LabelTag>
                <Typography.Text strong>{review.tool}</Typography.Text>
                <Typography.Text code>{review.policy_id}</Typography.Text>
                {review.escalation_level ? (
                  <LabelTag variant="filled" color={review.sla_breached ? 'error' : 'warning'}>
                    {review.escalation_level} · {review.sla_breached ? '已超时' : `${review.sla_minutes ?? 30} 分钟`}
                  </LabelTag>
                ) : null}
              </Space>
              <div className="zh-mt-4">
                <Typography.Text type="secondary">{review.reason}</Typography.Text>
              </div>
            </div>
            <Space>
              {review.status === '待复核' ? (
                <UiButton
                  size="small"
                  type="primary"
                  loading={busyId === review.id}
                  disabled={Boolean(busyId)}
                  onClick={() => onDecision(review, 'approve')}
                >
                  批准
                </UiButton>
              ) : null}
              {review.status === '待复核' ? (
                <UiButton
                  size="small"
                  danger
                  loading={busyId === review.id}
                  disabled={Boolean(busyId)}
                  onClick={() => onDecision(review, 'reject')}
                >
                  驳回
                </UiButton>
              ) : null}
              <UiButton size="small" onClick={() => onCopy(review)}>
                {copiedApprovalId === review.id ? '已复制' : '复制'}
              </UiButton>
            </Space>
          </div>
        ))}
        {!reviews.length && (
          <div className="zh-empty-panel">暂无复核单。运行外部邮件或批量导出样例后，系统会自动生成待复核记录。</div>
        )}
      </div>
    </PanelCard>
  );
}
