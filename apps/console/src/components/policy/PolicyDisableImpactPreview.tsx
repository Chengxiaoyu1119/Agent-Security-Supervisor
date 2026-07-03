import { Space, Typography } from 'antd';
import { ShieldAlert } from 'lucide-react';
import type { Policy } from '@/types';
import { LabelTag, UiButton } from '../ui';

type PolicyDisableImpactPreviewProps = {
  policy: Policy;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function listText(items?: string[]) {
  if (!items?.length) return '未绑定';
  return items.join(' / ');
}

export function PolicyDisableImpactPreview({
  policy,
  open,
  saving,
  onCancel,
  onConfirm
}: PolicyDisableImpactPreviewProps) {
  if (!open && !policy.disable_impact) return null;

  return (
    <div className={`zh-policy-impact-preview${open ? ' zh-policy-impact-preview--active' : ''}`}>
      <div className="zh-policy-impact-preview__notice">
        <ShieldAlert size={15} />
        <Typography.Text strong>
          {open ? '关闭前影响预览' : `关闭影响: ${policy.disable_impact ?? '会减少对应攻击面的监督覆盖'}`}
        </Typography.Text>
      </div>

      <div className="zh-policy-impact-preview__grid">
        <div>
          <Typography.Text type="secondary" className="zh-text-meta">
            影响攻击面
          </Typography.Text>
          <Typography.Text strong>{listText(policy.surface_ids)}</Typography.Text>
        </div>
        <div>
          <Typography.Text type="secondary" className="zh-text-meta">
            影响工具
          </Typography.Text>
          <Typography.Text strong>{listText(policy.tools)}</Typography.Text>
        </div>
        <div>
          <Typography.Text type="secondary" className="zh-text-meta">
            影响脚本
          </Typography.Text>
          <Typography.Text strong>{listText(policy.demo_scenarios)}</Typography.Text>
        </div>
      </div>

      {policy.risk_controls?.length ? (
        <Space size={[0, 8]} wrap>
          {policy.risk_controls.map((item) => (
            <LabelTag key={item} variant="filled" color="warning">
              {item}
            </LabelTag>
          ))}
        </Space>
      ) : null}

      {open ? (
        <Space wrap className="zh-policy-impact-preview__actions">
          <UiButton size="small" variant="danger" loading={saving} onClick={onConfirm}>
            确认关闭
          </UiButton>
          <UiButton size="small" onClick={onCancel}>
            取消
          </UiButton>
        </Space>
      ) : null}
    </div>
  );
}
