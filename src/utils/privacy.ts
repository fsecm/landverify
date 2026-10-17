/**
 * Privacy & Data Protection Utilities
 * Masks Personally Identifiable Information (PII) for public verification links
 * in compliance with national privacy and open data guidelines.
 */

export function maskName(fullName: string): string {
  if (!fullName) return '***';
  // Strip any dummy suffixes if present
  const cleaned = fullName.replace(/\(Dummy\)/gi, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return `${part[0]}${'*'.repeat(Math.min(part.length - 2, 4))}${part[part.length - 1]}`;
    })
    .join(' ');
}

export function maskNID(nid: string): string {
  if (!nid) return '***-***';
  if (nid.length <= 4) return '***' + nid;
  return nid.slice(0, 2) + '******' + nid.slice(-2);
}

export function getPublicVerifyUrl(qrToken: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/verify/${encodeURIComponent(qrToken)}`;
}
