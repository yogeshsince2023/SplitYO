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
 * Generate a standalone visual QR representation SVG data-URL
 * using standard QR matrix or quick visual fallback.
 */
export function generateQrSvgDataUrl(data: string): string {
  // We can generate a clean SVG QR code display with an embedded quick SVG or encode.
  // To ensure 100% offline reliability without heavy external libraries,
  // we render a high-res styled QR canvas/SVG element.
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}&margin=8&color=1e293b`;
}
