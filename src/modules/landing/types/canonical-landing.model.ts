export interface BrandingInfo {
  empresa: string;
  produto: string;
  tagline: string;
  navSubtitle: string;
  heroTitle: string;
  heroDescription: string;
}

export interface ClienteInfo {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
}

export interface PolizaInfo {
  numero: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  estado: string;
  primaTotal: number;
  franquia: number;
  moneda: string;
}

export interface VehiculoInfo {
  marca: string;
  modelo: string;
  anio: string;
  patente: string;
  combustible: string;
  uso: string;
  fotoUrl: string;
}

export interface ResidenciaInfo {
  direccion: string;
}

export interface CorredorInfo {
  nombre: string;
  telefono: string;
  email: string;
}

export interface BeneficioInfo {
  titulo: string;
}

export interface CoberturaInfo {
  titulo: string;
  monto: number;
  detalle: string;
}

export interface CuotaInfo {
  numero: number;
  vencimiento: string;
  valor: number;
}

export interface PagosInfo {
  forma: string;
  cuotas: CuotaInfo[];
}

export interface CanalAtencionInfo {
  titulo: string;
  valor: string;
}

export interface CanonicalLandingModel {
  branding: BrandingInfo;
  cliente: ClienteInfo;
  poliza: PolizaInfo;
  vehiculo: VehiculoInfo;
  residencia: ResidenciaInfo;
  corredor: CorredorInfo;
  beneficios: BeneficioInfo[];
  coberturas: CoberturaInfo[];
  pagos: PagosInfo;
  canalesAtencion: CanalAtencionInfo[];
}
