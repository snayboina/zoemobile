import { formatarDataHora, formatarData, formatarQuantidade } from '../utils/formatters';

describe('Suíte de Testes Unitários de Formatadores pt-BR', () => {
  it('deve formatar data simples corretamente', () => {
    const dataIso = '2026-05-10T14:30:00.000Z';
    const formatada = formatarData(dataIso);
    expect(formatada).toContain('2026');
  });

  it('deve retornar fallback seguro para data nula ou inválida', () => {
    expect(formatarData(null)).toBe('--/--/----');
    expect(formatarData('invalido')).toBe('--/--/----');
    expect(formatarDataHora(null)).toBe('--/--/---- --:--');
  });

  it('deve formatar quantidade com unidade de medida padrão', () => {
    expect(formatarQuantidade(15)).toBe('15 UN');
    expect(formatarQuantidade(3, 'CX')).toBe('3 CX');
  });
});
