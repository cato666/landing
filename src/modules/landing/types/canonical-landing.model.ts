export interface CanonicalPartyInfo {
  [key: string]: unknown;
}

export interface CanonicalLandingModel {
  branding: CanonicalPartyInfo;
  cliente: CanonicalPartyInfo;
  poliza: CanonicalPartyInfo;
  vehiculo: CanonicalPartyInfo;
  residencia: CanonicalPartyInfo;
  corredor: CanonicalPartyInfo;
  beneficios: Record<string, unknown>[];
  coberturas: Record<string, unknown>[];
  pagos: CanonicalPartyInfo;
  canalesAtencion: Record<string, unknown>[];
}
