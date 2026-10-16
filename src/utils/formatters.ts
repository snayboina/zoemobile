export function formatarDataHora(dataIso?: string | null): string {
  if (!dataIso) return '--/--/---- --:--';
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) return '--/--/---- --:--';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

export function formatarData(dataIso?: string | null): string {
  if (!dataIso) return '--/--/----';
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) return '--/--/----';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

export function formatarQuantidade(qtd: number, unidade: string = 'UN'): string {
  return `${qtd} ${unidade}`;
}
