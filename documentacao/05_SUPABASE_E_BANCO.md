# 05 â€” SUPABASE E BANCO DE DADOS

## 1. ConexÃ£o e InicializaÃ§Ã£o do Cliente
O aplicativo inicializa a conexÃ£o com o Supabase no arquivo `lib/core/supabase_config.dart`:
```dart
class SupabaseConfig {
  static String get url => dotenv.env['SUPABASE_URL'] ?? '';
  static String get anonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  static Future<void> initialize() async {
    await Supabase.initialize(url: url, anonKey: anonKey);
  }

  static SupabaseClient get client => Supabase.instance.client;
}
```
- As variÃ¡veis sÃ£o lidas do arquivo `.env` empacotado nos assets da aplicaÃ§Ã£o.
- As credenciais de serviÃ§o (`service_role`) **NÃƒO** estÃ£o presentes no aplicativo mÃ³vel, garantindo a conformidade com as regras de seguranÃ§a.

---

## 2. CatÃ¡logo de Tabelas e Mapeamento de Colunas

### 2.1 Tabela `public.produtos`
- **Finalidade:** Cadastro de itens, insumos, EPIs e ferramentas estocadas.
- **Colunas Identificadas no Dart:**
  - `id` (UUID - Chave PrimÃ¡ria)
  - `codigo_barras` (TEXT - CÃ³digo de identificaÃ§Ã£o Ãºnico)
  - `nome` (TEXT - DescriÃ§Ã£o do produto)
  - `categoria` (TEXT - Categoria mercadolÃ³gica)
  - `unidade_medida` (TEXT - UN, CX, KG, etc.)
  - `estoque_minimo` (INTEGER - Ponto de ressuprimento)
  - `empresa_id` (UUID - Tenant)
  - `excluido` (BOOLEAN - Flag de soft delete)
  - `consumo` (BOOLEAN - Se Ã© item consumÃ­vel)
  - `ca_numero` (TEXT - NÃºmero do Certificado de AprovaÃ§Ã£o de EPI)
  - `eh_epi` (BOOLEAN - Flag indicativa de EPI)
- **Consultas Realizadas pelo App:**
  - `SELECT *, estoque_atual(*), produto_conformidade(*)` com filtros `.eq('excluido', false)` e `.eq('empresa_id', ...)`
- **PermissÃµes PostgREST:** `SELECT, INSERT, UPDATE` concedidas para `anon, authenticated`. `DELETE e TRUNCATE` revogados.

### 2.2 Tabela `public.movimentacoes`
- **Finalidade:** Livro-razÃ£o fiscal e histÃ³rico de todas as entradas, saÃ­das, devoluÃ§Ãµes e consumos.
- **Colunas Identificadas no Dart:**
  - `id` (UUID - Chave PrimÃ¡ria)
  - `produto_id` (UUID - FK para produtos)
  - `funcionario_id` (UUID - FK para funcionÃ¡rios)
  - `prateleira_id` (UUID - FK para prateleiras)
  - `tipo` (TEXT - CHECK: 'EN', 'SA', 'DV', 'CONSUMO')
  - `quantidade` (INTEGER - Quantidade movimentada)
  - `observacao` (TEXT - Motivo ou detalhe)
  - `tipo_entrada` (TEXT - InventÃ¡rio, Compra, etc.)
  - `usuario_nome` (TEXT - Almoxarife operador)
  - `usuario_matricula` (TEXT - MatrÃ­cula do operador)
  - `device_id` (TEXT - Identificador do celular)
  - `app_version` (TEXT - VersÃ£o do aplicativo)
  - `os_platform` (TEXT - SO e versÃ£o)
  - `ip_address` (TEXT - EndereÃ§o IP do cliente)
  - `latitude` (NUMERIC/FLOAT - PosiÃ§Ã£o GPS)
  - `longitude` (NUMERIC/FLOAT - PosiÃ§Ã£o GPS)
  - `session_id` (TEXT - UUID da sessÃ£o de login)
  - `empresa_id` (UUID - Tenant)
  - `created_at` (TIMESTAMPTZ - Carimbo da transaÃ§Ã£o)
- **OperaÃ§Ãµes:**
  - `INSERT`: LanÃ§amento de movimentaÃ§Ã£o no app.
  - `SELECT`: Consulta recente com embed `*, produtos(nome), funcionarios(nome)`.
- **PermissÃµes PostgREST:** `SELECT, INSERT` concedidos. `UPDATE, DELETE, TRUNCATE` revogados por blindagem de integridade.

### 2.3 Tabela `public.estoque_atual`
- **Finalidade:** Saldo fÃ­sico atualizado em tempo real por produto e prateleira.
- **Colunas Identificadas:** `id`, `produto_id`, `prateleira_id`, `quantidade`, `empresa_id`, `updated_at`.
- **AutomaÃ§Ã£o de Banco:** Atualizado automaticamente via trigger `trg_update_estoque` executada apÃ³s cada `INSERT` em `movimentacoes`.

### 2.4 Tabela `public.funcionarios`
- **Finalidade:** Cadastro de operadores e colaboradores.
- **Colunas Identificadas:**
  - `id`, `cracha`, `nome`, `departamento`, `empresa_id`, `excluido`, `permite_login_app`.
  - `pin_hash` e `senha_movimentacao_hash` (Bloqueadas para leitura via `REVOKE SELECT`).

### 2.5 Tabela `public.prateleiras`
- **Finalidade:** Cadastro de locais fÃ­sicos no almoxarifado (endereÃ§amento).
- **Colunas Identificadas:** `id`, `codigo_localizacao`, `zona`, `empresa_id`, `excluido`.

### 2.6 Tabelas de InventÃ¡rio (`public.inventarios` e `public.inventario_itens`)
- **Finalidade:** CabeÃ§alho e itens detalhados das contagens fÃ­sicas de estoque.
- **Colunas Identificadas:**
  - `inventarios`: `id`, `status`, `observacao`, `empresa_id`, `created_at`.
  - `inventario_itens`: `id`, `inventario_id`, `produto_id`, `quantidade_sistema`, `quantidade_fisica`, `diferenca`.
  - *Nota:* A coluna `diferenca` Ã© declarada como `GENERATED ALWAYS AS (quantidade_fisica - quantidade_sistema) STORED` no banco de dados.

### 2.7 Tabela `public.audit_log`
- **Finalidade:** Trilha de auditoria e registro de incidentes de seguranÃ§a.
- **Colunas Identificadas:** `id`, `funcionario_id`, `device_id`, `action`, `details`, `latitude`, `longitude`, `app_version`, `os_platform`, `created_at`.

### 2.8 Tabela `public.produto_conformidade` *(NÃƒO VERIFICADO DIRETAMENTE NO DDL DO BANCO)*
- **EvidÃªncias no Dart:** Colunas `tipo_controle`, `data_validade`, `data_proxima_afericao`, `bloquear_vencido`, `controlar_por_unidade`, `status_manual`, `numero_ca`.

---

## 3. CatÃ¡logo de FunÃ§Ãµes Remotas (RPCs)

| Nome da RPC | ParÃ¢metros Recebidos | Retorno | Objetivo TÃ©cnico |
| :--- | :--- | :--- | :--- |
| `validar_login_funcionario` | `p_cracha`, `p_pin_hash`, `p_device_id`, `p_device_metadata`, `p_latitude`, `p_longitude` | `JSONB` | Autentica crachÃ¡ e PIN, valida autorizaÃ§Ã£o do aparelho mÃ³vel e devolve dados do operador. |
| `validar_senha_movimentacao` | `p_funcionario_id` (UUID), `p_senha_hash` (TEXT) | `JSONB` | Valida se o PIN de 4 dÃ­gitos digitado pelo operÃ¡rio confere com o hash no banco. |
| `cadastrar_senha_movimentacao_inicial` | `p_funcionario_id` (UUID), `p_senha_hash` (TEXT) | `JSONB` | Grava a senha de 4 dÃ­gitos do colaborador pela primeira vez. |
| `listar_produtos_empresa` | `p_empresa_id` (UUID) | `SETOF produtos` | Retorna catÃ¡logo de produtos com isolamento rigoroso por tenant. |
| `listar_movimentacoes_empresa` | `p_empresa_id` (UUID), `p_limit` (INT) | `SETOF movimentacoes` | Retorna extrato de movimentaÃ§Ãµes ordenado decrescentemente. |
| `obter_estoque_empresa` | `p_empresa_id` (UUID) | `TABLE(...)` | Consulta consolidada de saldos fÃ­sicos por prateleira. |
| `consultar_saldo_produto` | `p_produto_id` (UUID), `p_prateleira_id` (UUID) | `INTEGER` | Retorna saldo pontual de um item em determinada prateleira. |
| `admin_toggle_acesso_app_funcionario` | `p_funcionario_id` (UUID), `p_permite_login_app` (BOOLEAN) | `JSONB` | Habilita ou desabilita a permissÃ£o do funcionÃ¡rio para logar no app. |

---

## 4. Triggers e AutomaÃ§Ãµes no Banco de Dados
1. **`trg_update_estoque` (na tabela `movimentacoes`):**
   - Executa `update_estoque_balance()` com `SECURITY DEFINER`.
   - Se `tipo IN ('EN', 'DV')` -> Incrementa saldo em `estoque_atual` com `ON CONFLICT (produto_id, prateleira_id) DO UPDATE`.
   - Se `tipo IN ('SA', 'CONSUMO')` -> Subtrai saldo em `estoque_atual`.
2. **`trigger_set_empresa_movimentacao` (na tabela `movimentacoes`):**
   - Executa `set_empresa_id_movimentacao()`.
   - Intercepta inserÃ§Ãµes antes de salvar (`BEFORE INSERT`). Se `empresa_id` for nulo, busca o tenant associado ao `produto_id` ou ao `funcionario_id`, eliminando registros Ã³rfÃ£os.