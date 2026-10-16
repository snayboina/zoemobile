import { validarSenhaMovimentacao, validarCracha, isEpiValido } from '../utils/validators';

describe('Suíte de Testes Unitários de Regras de Validação', () => {
  describe('RN-018: Validação de Senha de Movimentação (PIN de 4 dígitos)', () => {
    it('deve aceitar PIN de 4 dígitos válido e seguro', () => {
      const resultado = validarSenhaMovimentacao('8492');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar PIN com menos de 4 dígitos', () => {
      const resultado = validarSenhaMovimentacao('123');
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toContain('4 dígitos');
    });

    it('deve rejeitar PIN com letras ou caracteres especiais', () => {
      const resultado = validarSenhaMovimentacao('12a4');
      expect(resultado.valido).toBe(false);
    });

    it('deve rejeitar 4 dígitos repetidos (ex: 1111)', () => {
      const resultado = validarSenhaMovimentacao('1111');
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toContain('repetidos');
    });

    it('deve rejeitar sequências óbvias como 1234 e 4321', () => {
      expect(validarSenhaMovimentacao('1234').valido).toBe(false);
      expect(validarSenhaMovimentacao('4321').valido).toBe(false);
    });
  });

  describe('RN-001: Validação de Crachá', () => {
    it('deve aceitar crachá válido', () => {
      expect(validarCracha('CR-1049')).toBe(true);
      expect(validarCracha('0012')).toBe(true);
    });

    it('deve rejeitar crachá vazio ou muito curto', () => {
      expect(validarCracha('')).toBe(false);
      expect(validarCracha('  ')).toBe(false);
      expect(validarCracha('12')).toBe(false);
    });
  });

  describe('RN-004: Validação de Validade de CA de EPI', () => {
    it('deve aprovar EPI com validade futura', () => {
      const dataFutura = new Date();
      dataFutura.setFullYear(dataFutura.getFullYear() + 1);
      expect(isEpiValido(dataFutura.toISOString())).toBe(true);
    });

    it('deve rejeitar EPI com CA vencido no passado', () => {
      const dataPassada = new Date('2020-01-01');
      expect(isEpiValido(dataPassada.toISOString())).toBe(false);
    });

    it('deve rejeitar EPI sem data de validade informada', () => {
      expect(isEpiValido(null)).toBe(false);
      expect(isEpiValido(undefined)).toBe(false);
    });
  });
});
