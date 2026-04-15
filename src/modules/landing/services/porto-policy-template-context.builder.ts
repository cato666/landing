import { Injectable } from '@nestjs/common';
import { CanonicalLandingModel } from '../types/canonical-landing.model';
import { TemplateContextBuilder } from '../types/template.type';

@Injectable()
export class PortoPolicyTemplateContextBuilder implements TemplateContextBuilder {
  supports(templateCode: string, _templateVersion: string): boolean {
    return templateCode === 'landing-poliza-mvp-ptbr-v2';
  }

  build(canonical: CanonicalLandingModel): Record<string, unknown> {
    const branding = canonical.branding;
    const cliente = canonical.cliente;
    const poliza = canonical.poliza;
    const vehiculo = canonical.vehiculo;
    const residencia = canonical.residencia;
    const canalesAtencion = canonical.canalesAtencion;
    const cuotas = Array.isArray(canonical.pagos.cuotas)
      ? (canonical.pagos.cuotas as Array<Record<string, unknown>>)
      : [];

    return {
      ...canonical,
      presentation: {
        brandTag: this.asString(branding.tagline, 'Apólice digital interativa'),
        navSubtitle: this.asString(branding.navSubtitle, 'MVP apólice visual interativa'),
        heroTitle: this.asString(branding.heroTitle, `Olá, ${this.asString(cliente.nome, 'cliente')}`),
        heroDescription: this.asString(
          branding.heroDescription,
          'Aqui você pode entender sua apólice de forma visual, simples e interativa.',
        ),
        vigenciaTexto: `${this.formatDate(this.asString(poliza.vigenciaDesde))} a ${this.formatDate(this.asString(poliza.vigenciaHasta))}`,
        vehicleTitle: [this.asString(vehiculo.marca), this.asString(vehiculo.modelo)]
          .filter(Boolean)
          .join(' ')
          .trim(),
        vehicleSubtitle: `Placa ${this.asString(vehiculo.patente, '-')} · Uso ${this.asString(vehiculo.uso, 'Particular').toLowerCase()}`,
        primaryChannel: this.asString(canalesAtencion[0]?.valor, '4004 7678'),
        mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(this.asString(residencia.direccion, 'Sao Paulo'))}&output=embed`,
        paymentChart: {
          labels: cuotas.map((cuota, index) => `Parcela ${this.asNumber(cuota.numero, index + 1)}`),
          values: cuotas.map((cuota) => this.asNumber(cuota.valor)),
        },
      },
    };
  }

  private asString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') {
      return value.trim() || fallback;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return fallback;
  }

  private asNumber(value: unknown, fallback = 0): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('pt-BR');
  }
}
