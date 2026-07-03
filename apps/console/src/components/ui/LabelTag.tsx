import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type LabelTagProps = TagProps;

export function LabelTag(props: LabelTagProps) {
  const className = props.className ? `zh-label-tag ${props.className}` : 'zh-label-tag';

  return <Tag {...props} className={className} />;
}
