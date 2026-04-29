import { Injectable } from '@nestjs/common';
import { PdfRendererService } from './pdf-renderer.service';
import { RenderMetadata } from '../types/render-metadata.type';

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(text: string): Buffer {
  const lines = ['%PDF-1.4'];
  const offsets: number[] = [0];

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    '',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  const contentStream = `BT\n/F1 18 Tf\n72 720 Td\n(${escapePdfText(text)}) Tj\nET`;
  objects[3] = `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  for (const object of objects) {
    offsets.push(Buffer.byteLength(lines.join(''), 'utf8'));
    lines.push(object);
  }

  const xrefOffset = Buffer.byteLength(lines.join(''), 'utf8');
  lines.push(`xref\n0 ${objects.length + 1}\n`);
  lines.push('0000000000 65535 f \n');

  for (let index = 1; index <= objects.length; index += 1) {
    lines.push(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  }

  lines.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(lines.join(''), 'utf8');
}

@Injectable()
export class PlaceholderPdfRendererService implements PdfRendererService {
  async render(_html: string, metadata: RenderMetadata): Promise<Buffer | null> {
    if (process.env.LANDING_PDF_MODE !== 'placeholder') {
      return null;
    }

    const text = `Landing ${metadata.renderId} (${metadata.templateCode}@${metadata.templateVersion})`;
    return buildSimplePdf(text);
  }
}