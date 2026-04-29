import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { JsonValidationService } from './json-validation.service';

function buildValidRenderRequest() {
  return {
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    expiresAt: '2027-04-18T23:59:59.000Z',
    data: {
      cliente: {
        nome: 'Maria Silva',
      },
      poliza: {
        numero: 'PS-2026-0001',
        vigenciaDesde: '2026-04-13',
        vigenciaHasta: '2027-04-12',
      },
      vehiculo: {
        modelo: 'Corolla Altis',
        placa: 'ABCD123',
      },
      coberturas: [{ titulo: 'Cobertura total' }],
    },
  };
}

test('JsonValidationService acepta un render request valido', () => {
  const service = new JsonValidationService();
  const request = buildValidRenderRequest();

  const parsed = service.validateRenderRequest(request);
  const parsedData = parsed.data as {
    cliente: { nome: string };
  };

  assert.equal(parsed.templateCode, request.templateCode);
  assert.equal(parsed.expiresAt, request.expiresAt);
  assert.equal(parsedData.cliente.nome, 'Maria Silva');
});

test('JsonValidationService informa campos faltantes con rutas claras', () => {
  const service = new JsonValidationService();
  const request = buildValidRenderRequest() as Record<string, unknown>;
  const data = request.data as Record<string, unknown>;
  const cliente = data.cliente as Record<string, unknown>;
  const vehiculo = data.vehiculo as Record<string, unknown>;

  delete cliente.nome;
  delete vehiculo.placa;

  assert.throws(
    () => service.validateRenderRequest(request),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);

      const response = error.getResponse() as {
        message: string;
        invalidFields: string[];
        issues: Array<{ path: string; message: string }>;
      };

      assert.equal(response.message, 'Render request invalido');
      assert.deepEqual(response.invalidFields.sort(), ['data.cliente.nome', 'data.vehiculo.patente'].sort());
      assert.ok(response.issues.some((issue) => issue.path === 'data.cliente.nome'));
      assert.ok(response.issues.some((issue) => issue.path === 'data.vehiculo.patente'));
      return true;
    },
  );
});

test('JsonValidationService rechaza expiresAt vencido', () => {
  const service = new JsonValidationService();
  const request = buildValidRenderRequest();
  request.expiresAt = '2020-01-01T00:00:00.000Z';

  assert.throws(
    () => service.validateRenderRequest(request),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);

      const response = error.getResponse() as {
        invalidFields: string[];
        issues: Array<{ path: string; message: string }>;
      };

      assert.ok(response.invalidFields.includes('expiresAt'));
      assert.ok(response.issues.some((issue) => issue.path === 'expiresAt'));
      return true;
    },
  );
});