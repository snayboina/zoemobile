export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'DEVOLUCAO' | 'AJUSTE';

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  ativo: boolean;
}

export interface Funcionario {
  id: string;
  empresa_id: string;
  nome: string;
  cracha: string;
  cargo?: string;
  departamento?: string;
  permite_login_app: boolean;
  tem_senha_movimentacao: boolean;
  created_at?: string;
}

export interface Produto {
  id: string;
  empresa_id: string;
  nome: string;
  codigo_barras: string;
  is_epi: boolean;
  numero_ca?: string | null;
  validade_ca?: string | null; // ISO Date YYYY-MM-DD
  categoria?: string;
  unidade_medida?: string;
  estoque_minimo?: number;
  estoque_atual?: number;
  ativo: boolean;
}

export interface Prateleira {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}

export interface Movimentacao {
  id?: string;
  empresa_id: string;
  funcionario_id: string;
  produto_id: string;
  prateleira_id?: string | null;
  tipo: TipoMovimentacao;
  quantidade: number;
  saldo_anterior: number;
  saldo_resultante: number;
  motivo?: string;
  assinatura_base64?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  device_id?: string | null;
  synced?: boolean;
  created_at?: string;
}

export interface ItemCarrinhoMovimentacao {
  produto: Produto;
  prateleira?: Prateleira | null;
  quantidade: number;
  saldoAtualPrateleira: number;
}
