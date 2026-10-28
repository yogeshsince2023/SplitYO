import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  upiId: string;
  payeeName: string;
  amountMinor: number;
  currency: string;
  note?: string;
}

/** Generates standard NPCI UPI Payment URI string */
export function generateUpiUri(details: UpiPaymentDetails): string {
  const amountMajor = (details.amountMinor / 100).toFixed(2);
  const note = details.note || 'SplitMate Settlement';
  const params = new URLSearchParams({
    pa: details.upiId,
    pn: details.payeeName,
    am: amountMajor,
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate a 100% offline, local SVG QR code representation data-URL.
 * Keeps all financial details private without transmitting data to any third-party server.
 */
export function generateQrSvgDataUrl(data: string): string {
  if (!data) return '';
  try {
    const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const margin = 2;
    const viewBoxSize = size + margin * 2;
    let paths = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          paths += `M${c + margin},${r + margin}h1v1h-1z `;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff" rx="1"/><path d="${paths}" fill="#0f172a"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch (err) {
    console.error('Failed to generate local QR code:', err);
    return '';
  }
}
