import { SecurityDiagnostic } from '../../types';

export class IntegrityService {
  /**
   * Diagnóstico de segurança e integridade do dispositivo.
   * No Módulo 1, consolida o status estrutural inicial.
   */
  static getDiagnosticSnapshot(): SecurityDiagnostic {
    return {
      rootDetected: false,
      biometricsAvailable: false,
      deviceBindingValid: true,
      offlineQueuePendingCount: 0,
      lastSyncTimestamp: null,
      appIntegrityOk: true,
    };
  }
}
