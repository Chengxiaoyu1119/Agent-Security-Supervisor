import React, { type ComponentProps, type ReactNode } from 'react';
import { TitleFormatterProvider } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/ThemeProvider/TitleFormatter';

const DOCS_BROWSER_TITLE = '大模型智能体攻击面研究与行为监督平台 文档';

type FormatterProp = ComponentProps<typeof TitleFormatterProvider>['formatter'];

const formatter: FormatterProp = () => DOCS_BROWSER_TITLE;

export default function ThemeProviderTitleFormatter({ children }: Props): ReactNode {
  return <TitleFormatterProvider formatter={formatter}>{children}</TitleFormatterProvider>;
}
