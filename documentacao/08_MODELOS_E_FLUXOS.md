# 08 â€” MODELOS DE DADOS E FLUXOGRAMAS

## 1. Contratos de Dados em TypeScript (Modelos React Native)

```typescript
// Modelo de Produto e Conformidade de EPI
export interface ProdutoConformidade {
  tipo_controle: 'CA' | 'AFERICAO';
  data_validade?: string;
  data_proxima_afericao?: string;
  bloquear_vencido: boolean;
  controlar_por_unidade: boolean;
  status_manual?: 'LIBERADO' | 'BLOQUEADO';
  numero_ca?: string;
}

export interface ProdutoModel {
  id: string;
  codigo: string;              // codigo_barras no Supabase
  nome: string;
  categoria?: string;
  unidade?: string;            // unidade_medida no Supabase
  estoqueAtual: number;        // agregado via join da tabela estoque_atual
  estoqueMinimo: number;
  prateleiraId?: string;
  ativo: boolean;              // !excluido no Supabase
  consumo: boolean;
  conformidade?: ProdutoConformidade;
  caNumero?: string;
  ehEpi?: boolean;
}

// Modelo de FuncionÃ¡rio
export interface FuncionarioModel {
  id: string;
  cracha: string;
  nome: string;
  departamento?: string;
  ativo: boolean;
  empresaId?: string;
  empresaNome?: string;
  senhaMovimentacao?: string;  // hash SHA-256
}

// Modelo de MovimentaÃ§Ã£o (Livro-RazÃ£o)
export interface MovimentacaoModel {
  id?: string;
  produtoId: string;
  funcionarioId?: string;
  prateleiraId?: string;
  tipo: 'EN' | 'SA' | 'DV' | 'CONSUMO';
  quantidade: number;
  observacao?: string;
  tipoEntrada?: string;
  createdAt?: string;
  nomeProduto?: string;
  nomeFuncionario?: string;
  usuarioNome?: string;
  usuarioMatricula?: string;
  deviceId?: string;
  appVersion?: string;
  osPlatform?: string;
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  sessionId?: string;
  empresaId?: string;
}

// Modelo de Prateleira (EndereÃ§amento FÃ­sico)
export interface PrateleiraModel {
  id?: string;
  codigoLocalizacao: string;
  zona: string;
}

// Modelo de InventÃ¡rio
export interface InventarioModel {
  id?: string;
  produtoId: string;
  usuarioId: string;
  quantidadeSistema: number;
  quantidadeReal: number;
  diferenca: number;
  observacao?: string;
  createdAt?: string;
}
```

---

## 2. Fluxograma Operacional: SaÃ­da de Mercadoria e Assinatura
```mermaid
flowchart TD
    Inicio([InÃ­cio da SaÃ­da]) --> SelecionaFunc[Seleciona FuncionÃ¡rio por CrachÃ¡ / QR Code]
    SelecionaFunc --> SelecionaProd[Seleciona Produtos no CatÃ¡logo]
    SelecionaProd --> InformaQtd[Informa Quantidade]
    InformaQtd --> ValidaSaldo{Quantidade <= Saldo FÃ­sico?}
    ValidaSaldo -- NÃ£o --> ErroSaldo[Exibe Erro: Saldo Insuficiente]
    ErroSaldo --> InformaQtd

    ValidaSaldo -- Sim --> ValidaEPI{Ã‰ EPI com CA Vencido ou Bloqueado?}
    ValidaEPI -- Sim --> BloqueioEPI[Modal: SaÃ­da Bloqueada por SeguranÃ§a]
    BloqueioEPI --> SelecionaProd

    ValidaEPI -- NÃ£o --> AddCarrinho[Adiciona ao Carrinho de SaÃ­da]
    AddCarrinho --> MaisItens{Deseja Adicionar Mais Itens?}
    MaisItens -- Sim --> SelecionaProd

    MaisItens -- NÃ£o --> ConfirmaLote[Clica em Confirmar SaÃ­da]
    ConfirmaLote --> PossuiSenha{Colaborador jÃ¡ tem senha de 4 dÃ­gitos?}
    PossuiSenha -- NÃ£o --> CriaSenha[Modal: Cadastrar Senha Inicial de 4 DÃ­gitos]
    CriaSenha --> ConfirmaSenha
    PossuiSenha -- Sim --> ConfirmaSenha[Modal: Digitar Senha de 4 DÃ­gitos]

    ConfirmaSenha --> ValidaRPC{Senha Correta?}
    ValidaRPC -- NÃ£o --> ErroSenha[Exibe Erro de Senha]
    ErroSenha --> ConfirmaSenha

    ValidaRPC -- Sim --> TentaEnvio{Dispositivo Online?}
    TentaEnvio -- Sim --> SalvaSupabase[Grava em movimentacoes no Supabase]
    SalvaSupabase --> Trigger[Trigger atualiza estoque_atual no banco]
    TentaEnvio -- NÃ£o --> SalvaFila[Grava na Fila Offline local]
    
    Trigger --> Sucesso([Fim: TransaÃ§Ã£o ConcluÃ­da com Sucesso])
    SalvaFila --> Sucesso
```