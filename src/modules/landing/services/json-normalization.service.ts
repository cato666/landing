import { Injectable } from '@nestjs/common';
import {
  BeneficioInfo,
  CanalAtencionInfo,
  CanonicalLandingModel,
  ClienteInfo,
  CoberturaInfo,
  CorredorInfo,
  PagosInfo,
  PolizaInfo,
  ResidenciaInfo,
  VehiculoInfo,
} from '../types/canonical-landing.model';

@Injectable()
export class JsonNormalizationService {
  normalize(data: Record<string, unknown>): CanonicalLandingModel {
    return {
      branding: this.normalizeBranding(data),
      cliente: this.normalizeCliente(data),
      poliza: this.normalizePoliza(data),
      vehiculo: this.normalizeVehiculo(data),
      residencia: this.normalizeResidencia(data),
      corredor: this.normalizeCorredor(data),
      beneficios: this.normalizeBeneficios(data.beneficios),
      coberturas: this.normalizeCoberturas(data.coberturas),
      pagos: this.normalizePagos(data.pagos),
      canalesAtencion: this.normalizeCanalesAtencion(data.canalesAtencion),
    };
  }

  private normalizeBranding(data: Record<string, unknown>): CanonicalLandingModel['branding'] {
    const branding = this.asObject(data.branding);

    return {
      empresa: this.asString(branding.empresa, 'Porto Seguro'),
      produto: this.asString(branding.produto ?? branding.producto, 'Auto Private'),
      tagline: this.asString(branding.tagline, 'Apolice digital interativa'),
      navSubtitle: this.asString(branding.navSubtitle, 'MVP apolice visual interativa'),
      heroTitle: this.asString(branding.heroTitle, `Ola, ${this.asString(this.asObject(data.cliente).nome, 'cliente')}`),
      heroDescription: this.asString(
        branding.heroDescription,
        'Aqui voce pode entender sua apolice de forma visual, simples e interativa.',
      ),
    };
  }

  private normalizeCliente(data: Record<string, unknown>): ClienteInfo {
    const cliente = this.asObject(data.cliente);

    return {
      nome: this.asString(cliente.nome),
      documento: this.asString(cliente.documento ?? cliente.cpf),
      telefone: this.asString(cliente.telefone ?? cliente.telefono),
      email: this.asString(cliente.email),
    };
  }

  private normalizePoliza(data: Record<string, unknown>): PolizaInfo {
    const poliza = this.asObject(data.poliza);

    return {
      numero: this.asString(poliza.numero),
      vigenciaDesde: this.asString(poliza.vigenciaDesde ?? poliza.vigencia_inicio, ''),
      vigenciaHasta: this.asString(poliza.vigenciaHasta ?? poliza.vigencia_fin, ''),
      estado: this.asString(poliza.estado ?? poliza.status, 'Vigente'),
      primaTotal: this.asNumber(poliza.primaTotal ?? poliza.premioTotal),
      franquia: this.asNumber(poliza.franquia),
      moneda: this.asString(poliza.moneda, 'BRL'),
    };
  }

  private normalizeVehiculo(data: Record<string, unknown>): VehiculoInfo {
    const vehiculo = this.asObject(data.vehiculo);

    return {
      marca: this.asString(vehiculo.marca, ''),
      modelo: this.asString(vehiculo.modelo),
      anio: this.asString(vehiculo.anio),
      patente: this.asString(vehiculo.patente ?? vehiculo.placa),
      combustible: this.asString(vehiculo.combustible ?? vehiculo.combustivel),
      uso: this.asString(vehiculo.uso, 'Particular'),
      fotoUrl: this.asString(
        vehiculo.fotoUrl,
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
      ),
    };
  }

  private normalizeResidencia(data: Record<string, unknown>): ResidenciaInfo {
    const residencia = this.asObject(data.residencia);

    return {
      direccion: this.asString(
        residencia.direccion ?? residencia.endereco ?? residencia.enderecoCompleto,
        'Sao Paulo',
      ),
    };
  }

  private normalizeCorredor(data: Record<string, unknown>): CorredorInfo {
    const corredor = this.asObject(data.corredor);

    return {
      nombre: this.asString(corredor.nombre ?? corredor.nome),
      telefono: this.asString(corredor.telefono ?? corredor.telefone),
      email: this.asString(corredor.email),
    };
  }

  private normalizeBeneficios(value: unknown): BeneficioInfo[] {
    return this.asArray(value).map((item) => ({
      titulo: this.asString(item.titulo ?? item.title ?? item.descripcion, 'Beneficio'),
    }));
  }

  private normalizeCoberturas(value: unknown): CoberturaInfo[] {
    return this.asArray(value).map((item) => ({
      titulo: this.asString(item.titulo ?? item.nombre, 'Cobertura'),
      monto: this.asNumber(item.monto ?? item.valor),
      detalle: this.asString(item.detalle ?? item.descripcion, 'Sem detalhe adicional.'),
    }));
  }

  private normalizePagos(value: unknown): PagosInfo {
    const pagos = this.asObject(value);
    const cuotas = this.asArray(pagos.cuotas ?? pagos.parcelas).map((item, index) => ({
      numero: this.asNumber(item.numero, index + 1),
      vencimiento: this.asString(item.vencimiento ?? item.fecha, ''),
      valor: this.asNumber(item.valor ?? item.monto),
    }));

    return {
      forma: this.asString(pagos.forma ?? pagos.metodo, '-'),
      cuotas,
    };
  }

  private normalizeCanalesAtencion(value: unknown): CanalAtencionInfo[] {
    const canales = this.asArray(value).map((item) => ({
      titulo: this.asString(item.titulo ?? item.tipo, 'Canal 24h'),
      valor: this.asString(item.valor, '-'),
    }));

    return canales.length > 0 ? canales : [{ titulo: 'Canal 24h', valor: '4004 7678' }];
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asArray(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
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
}
