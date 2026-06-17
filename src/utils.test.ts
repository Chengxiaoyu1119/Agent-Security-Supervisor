import { afterEach, describe, expect, it, vi } from 'vitest';
import { riskLabel, writeClipboardText } from './utils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utils', () => {
  it('provides labels for every risk level used by the UI', () => {
    expect(Object.keys(riskLabel).sort()).toEqual(['critical', 'high', 'low', 'medium']);
    expect(riskLabel.critical).toBeTruthy();
    expect(riskLabel.high).toBeTruthy();
    expect(riskLabel.medium).toBeTruthy();
    expect(riskLabel.low).toBeTruthy();
  });

  it('writes text through the browser clipboard API when available', async () => {
    const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    await expect(writeClipboardText('audit evidence')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('audit evidence');
  });

  it('falls back to document copy when clipboard API fails', async () => {
    const writeText = vi.fn<Clipboard['writeText']>().mockRejectedValue(new Error('blocked'));
    const execCommand = vi.fn<(commandId: string) => boolean>().mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    });

    await expect(writeClipboardText('fallback evidence')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
  });
});
