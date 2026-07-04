import type { ApprovalReview } from '@/types';

export function approvalReviewRank(review: ApprovalReview) {
  if (review.status === '待复核') return 0;
  if (review.status === '已驳回') return 1;
  return 2;
}

export function compareApprovalReviews(a: ApprovalReview, b: ApprovalReview) {
  const rankDiff = approvalReviewRank(a) - approvalReviewRank(b);
  if (rankDiff !== 0) return rankDiff;
  if (a.sla_breached !== b.sla_breached) return a.sla_breached ? -1 : 1;
  const riskDiff = (b.risk_score ?? 0) - (a.risk_score ?? 0);
  if (riskDiff !== 0) return riskDiff;
  return b.created_at.localeCompare(a.created_at);
}
