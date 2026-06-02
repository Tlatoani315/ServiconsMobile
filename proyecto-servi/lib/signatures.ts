import type { Firma } from '../types/models';

export type StrokePoint = { x: number; y: number };

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 140;

export function strokeToPath(stroke: StrokePoint[]): string {
  if (stroke.length < 2) return '';
  return stroke.reduce(
    (acc, point, index) =>
      index === 0 ? `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}` : `${acc} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    '',
  );
}

export function strokesToSvgDataUrl(strokes: StrokePoint[][]): string {
  const paths = strokes
    .filter((stroke) => stroke.length > 1)
    .map(
      (stroke) =>
        `<path d="${strokeToPath(stroke)}" stroke="#0B1F17" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">${paths}</svg>`;
  const base64 = globalThis.btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

export function hasValidStroke(strokes: StrokePoint[][]): boolean {
  return strokes.some((stroke) => stroke.length > 1);
}

export function buildFirmaObject(params: {
  dataUrl: string;
  signerRole: Firma['signerRole'];
  signerName: string;
}): Firma {
  return {
    format: 'data-url',
    mime: 'image/png',
    encoding: 'base64',
    capturedAt: new Date().toISOString(),
    signerRole: params.signerRole,
    signerName: params.signerName,
    data: params.dataUrl,
  };
}

export const SIGNATURE_CANVAS = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
};
