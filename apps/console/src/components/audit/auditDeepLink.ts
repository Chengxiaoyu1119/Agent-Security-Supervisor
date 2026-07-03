export const auditDeepLinkEvent = 'agent-supervisor:audit-deep-link';

export function getAuditIdFromHash(hash = window.location.hash) {
  const queryStart = hash.indexOf('?');
  if (queryStart < 0) return '';

  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('audit_id')?.trim() ?? '';
}

export function auditLogHash(auditId: string) {
  return `#/audit?audit_id=${encodeURIComponent(auditId.trim())}`;
}

export function openAuditLogById(auditId: string) {
  const normalized = auditId.trim();
  if (!normalized) return;

  window.history.pushState(null, '', auditLogHash(normalized));
  const hashEvent = typeof HashChangeEvent === 'function' ? new HashChangeEvent('hashchange') : new Event('hashchange');
  window.dispatchEvent(hashEvent);
  window.dispatchEvent(new CustomEvent(auditDeepLinkEvent, { detail: { auditId: normalized } }));
}
