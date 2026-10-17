/**
 * Exceções de Domínio do ZOESTOCK Mobile.
 */
export class OfflineQueueException extends Error {
  constructor(message = 'Dispositivo sem internet. Registro salvo offline e será sincronizado automaticamente!') {
    super(message);
    this.name = 'OfflineQueueException';
  }
}

export class BusinessRuleException extends Error {
  readonly code: string;

  constructor(message: string, code = 'BUSINESS_RULE_ERROR') {
    super(message);
    this.name = 'BusinessRuleException';
    this.code = code;
  }
}
