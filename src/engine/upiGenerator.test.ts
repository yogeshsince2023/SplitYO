import { describe, it, expect } from 'vitest';
import { generateUpiUri, generateQrSvgDataUrl } from './upiGenerator';

describe('upiGenerator', () => {
  it('generates a standard NPCI UPI URI string', () => {
    const uri = generateUpiUri({
      upiId: 'priyapatel@okaxis',
      payeeName: 'Priya Patel',
      amountMinor: 250000,
      currency: 'INR',
      note: 'Dinner split',
    });

    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=priyapatel%40okaxis');
    expect(uri).toContain('pn=Priya+Patel');
    expect(uri).toContain('am=2500.00');
    expect(uri).toContain('cu=INR');
  });

  it('generates a 100% local, offline SVG data URL without external network calls', () => {
    const uri = 'upi://pay?pa=arjunsharma@oksbi&am=150.00';
    const qrUrl = generateQrSvgDataUrl(uri);

    // Security & privacy invariant: must NOT call external third-party server
    expect(qrUrl).not.toContain('api.qrserver.com');
    expect(qrUrl).not.toContain('http://');
    expect(qrUrl).not.toContain('https://');

    // Invariant: must be a valid inline SVG data URI
    expect(qrUrl.startsWith('data:image/svg+xml')).toBe(true);
  });
});
