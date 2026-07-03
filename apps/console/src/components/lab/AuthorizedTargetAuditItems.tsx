import { Descriptions, Space, Typography } from 'antd';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';

type AuthorizedTargetAuditItemsProps = {
  preflightAuditId: string;
  responseAuditId: string;
};

export function AuthorizedTargetAuditItems({ preflightAuditId, responseAuditId }: AuthorizedTargetAuditItemsProps) {
  return (
    <>
      <Descriptions.Item label="预检审计">
        <Space wrap>
          <Typography.Text code>{preflightAuditId}</Typography.Text>
          <AuditDeepLinkButton auditId={preflightAuditId}>查看</AuditDeepLinkButton>
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="响应审计">
        <Space wrap>
          <Typography.Text code>{responseAuditId}</Typography.Text>
          <AuditDeepLinkButton auditId={responseAuditId}>查看</AuditDeepLinkButton>
        </Space>
      </Descriptions.Item>
    </>
  );
}
