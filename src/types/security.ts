export interface RootStatus {
  isJailBroken: boolean;
  isRealDevice: boolean;
  isOnExternalStorage: boolean;
  hasSuspiciousBinaries: boolean;
}

export interface SecurityDiagnostic {
  rootDetected: boolean;
  biometricsAvailable: boolean;
  deviceBindingValid: boolean;
  offlineQueuePendingCount: number;
  lastSyncTimestamp: string | null;
  appIntegrityOk: boolean;
}
