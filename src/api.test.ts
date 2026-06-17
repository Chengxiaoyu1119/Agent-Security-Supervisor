import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOverview, fetchReport } from './api';
import type { Overview, ReportData } from './types';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('fetches JSON with the shared request wrapper', async () => {
    const overview = {
      attack_surfaces: [],
      scenarios: [],
      models: [],
      recent_runs: [],
      alerts: [],
      audit_logs: [],
      summary: {
        surface_count: 0,
        scenario_count: 0,
        recent_run_count: 0,
        block_rate: 0,
        attack_success_rate: 0,
        avg_latency_ms: 0
      }
    } satisfies Overview;
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => overview
    } as Response);

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOverview()).resolves.toEqual(overview);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/overview',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('falls back to local overview data when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));

    const overview = await fetchOverview();

    expect(overview.summary.surface_count).toBeGreaterThan(0);
    expect(overview.models.length).toBeGreaterThan(0);
  });

  it('uses an abort signal for report loading', async () => {
    const report = { markdown: '# report' } as ReportData;
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => report
    } as Response);

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchReport()).resolves.toEqual(report);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
