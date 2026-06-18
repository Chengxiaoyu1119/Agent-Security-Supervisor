import { Space, Typography } from 'antd';

interface DefenseEvidenceHeaderProps {
  completeCount: number;
  hashValidCount: number;
  totalCount: number;
  visibleCount: number;
}

export function DefenseEvidenceHeader({
  completeCount,
  hashValidCount,
  totalCount,
  visibleCount
}: DefenseEvidenceHeaderProps) {
  return (
    <div className="zh-defense-evidence-head">
      <div>
        <Typography.Title level={4} className="zh-defense-evidence-title">
          答辩证据视图
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="zh-defense-evidence-subtitle">
          每张证据卡都来自真实运行记录，用于说明攻击可复现、防护可控制、审计可校验。
        </Typography.Paragraph>
      </div>
      <Space size="large">
        <div>
          <Typography.Text type="secondary" className="zh-meta-block">
            证据完整
          </Typography.Text>
          <Typography.Text strong>
            {completeCount}/{totalCount}
          </Typography.Text>
        </div>
        <div>
          <Typography.Text type="secondary" className="zh-meta-block">
            hash 有效
          </Typography.Text>
          <Typography.Text strong>
            {hashValidCount}/{totalCount}
          </Typography.Text>
        </div>
        <div>
          <Typography.Text type="secondary" className="zh-meta-block">
            当前显示
          </Typography.Text>
          <Typography.Text strong>{visibleCount}</Typography.Text>
        </div>
      </Space>
    </div>
  );
}
