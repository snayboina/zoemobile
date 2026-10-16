/**
 * Validação rigorosa de PIN de 4 dígitos conforme RN-018:
 * - Exatamente 4 dígitos numéricos
 * - Não pode conter todos os dígitos iguais (ex: 1111, 0000)
 * - Não pode ser sequência crescente (ex: 1234)
 * - Não pode ser sequência decrescente (ex: 4321)
 */
export function validarSenhaMovimentacao(pin: string): { valido: boolean; motivo?: string } {
  if (!pin || pin.length !== 4) {
    return { valido: false, motivo: 'A senha de movimentação deve conter exatamente 4 dígitos.' };
  }

  if (!/^\d{4}$/.test(pin)) {
    return { valido: false, motivo: 'A senha deve conter apenas números.' };
  }

  // Verifica dígitos todos iguais
  if (pin[0] === pin[1] && pin[1] === pin[2] && pin[2] === pin[3]) {
    return { valido: false, motivo: 'A senha não pode ser formada por 4 dígitos repetidos.' };
  }

  // Sequências óbvias
  const sequenciasInvalidas = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
  if (sequenciasInvalidas.includes(pin)) {
    return { valido: false, motivo: 'Não utilize sequências simples como 1234 ou 4321.' };
  }

  return { valido: true };
}

/**
 * Validação de Crachá conforme RN-001:
 * - Não pode ser vazio
 * - Mínimo de 3 caracteres
 */
export function validarCracha(cracha: string): boolean {
  if (!cracha) return false;
  const limpo = cracha.trim();
  return limpo.length >= 3 && limpo.length <= 30;
}

/**
 * Validação de validade de EPI conforme RN-004:
 * Retorna true se a data de validade for hoje ou posterior.
 */
export function isEpiValido(dataValidadeIso?: string | null): boolean {
  if (!dataValidadeIso) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataValidade = new Date(dataValidadeIso);
  dataValidade.setHours(0, 0, 0, 0);

  return dataValidade.getTime() >= hoje.getTime();
}
