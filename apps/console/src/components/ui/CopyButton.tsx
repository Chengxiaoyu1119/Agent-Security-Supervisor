import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { writeClipboardText } from '@/utils';
import { UiButton } from './Button';
import type { UiButtonProps } from './Button';

export type CopyButtonProps = Omit<UiButtonProps, 'onClick' | 'icon'> & {
  text: string | (() => string | Promise<string>);
  copiedText?: React.ReactNode;
  timeoutMs?: number;
};

export function CopyButton({
  text,
  children = '复制',
  copiedText = '已复制',
  timeoutMs = 1600,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const value = typeof text === 'function' ? await text() : text;
    const ok = await writeClipboardText(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), timeoutMs);
  }

  return (
    <UiButton icon={<Copy size={16} />} onClick={handleCopy} {...props}>
      {copied ? copiedText : children}
    </UiButton>
  );
}
