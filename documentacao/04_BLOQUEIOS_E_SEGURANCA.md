# 04 â€” AUDITORIA DE SEGURANÃ‡A E BLOQUEIOS

Este documento detalha todos os mecanismos de defesa, autenticaÃ§Ã£o, integridade e mitigaÃ§Ã£o de ameaÃ§as do ecossistema ZoeStock, estabelecendo a distinÃ§Ã£o tÃ©cnica entre as defesas do cliente e as defesas do servidor.

---

## 1. Comparativo: SeguranÃ§a Cliente vs SeguranÃ§a Backend

| Mecanismo de Controle | Camada Cliente (App MÃ³vel) | Camada Backend (Supabase / PostgreSQL) | AvaliaÃ§Ã£o de EficÃ¡cia |
| :--- | :--- | :--- | :--- |
| **AutenticaÃ§Ã£o de Operador** | Valida preenchimento de 6 dÃ­gitos no PIN e crachÃ¡ antes do envio. | Valida hash SHA-256 via RPC `validar_login_funcionario` com verificaÃ§Ã£o de status ativo no banco. | **Robusto:** O servidor Ã© a autoridade final; cliente atua na higienizaÃ§Ã£o. |
| **Isolamento Multitenant** | ClÃ¡usula `.eq('empresa_id', ...)` anexada nas queries pelo serviÃ§o. | PolÃ­ticas RLS no PostgreSQL garantindo que nenhuma linha de outro tenant seja exposta. | **AtenÃ§Ã£o:** Se o RLS estiver com polÃ­ticas permissivas genÃ©ricas (`USING (true)` para anon), a seguranÃ§a depende exclusivamente do filtro do cliente. Exige auditoria contÃ­nua de RLS. |
| **Bloqueio de Aparelho** | Redireciona para tela `PendingDeviceScreen` se `status != 'APROVADO'`. | RPC rejeita autenticaÃ§Ã£o e gera log de auditoria se o `device_id` nÃ£o estiver homologado em `dispositivos_moveis`. | **Robusto:** O backend impede geraÃ§Ã£o de sessÃ£o vÃ¡lida se o aparelho estiver revogado. |
| **Bloqueio de Saldo Negativo** | Valida se `quantidade <= estoqueAtual` antes de adicionar ao carrinho. | Triggers e constraints de integridade no PostgreSQL impedem estouro de saldo fÃ­sico. | **Parcial:** A trigger atual `update_estoque_balance` apenas subtrai (`quantidade = quantidade - NEW.quantidade`), sem constraint `CHECK (quantidade >= 0)` em `estoque_atual`. Recomendado adicionar constraint no banco. |
| **Bloqueio de EPI Vencido** | Compara data de CA / aferiÃ§Ã£o com a data atual e barra adiÃ§Ã£o ao carrinho. | FunÃ§Ãµes RPC ou triggers podem ser adicionadas para validar a validade antes do INSERT de movimentaÃ§Ãµes. | **Vulnerabilidade Identificada:** O bloqueio de EPI Ã© 100% executado no Frontend Flutter. Uma inserÃ§Ã£o direta na API sem passar pela tela violaria essa regra. |
| **Assinatura por Senha (4 dÃ­gitos)** | Exige digitaÃ§Ã£o no modal e confere hash via RPC. | RPC `validar_senha_movimentacao` compara hash SHA-256 no banco de dados. | **Robusto:** A confirmaÃ§Ã£o do hash Ã© realizada pelo PostgreSQL. |
| **ProteÃ§Ã£o contra ExclusÃ£o / DestruiÃ§Ã£o** | O aplicativo nÃ£o possui botÃµes ou rotas para apagar produtos ou movimentaÃ§Ãµes. | `REVOKE DELETE, TRUNCATE` nas tabelas operacionais para as roles `anon` e `public`. | **Excelente:** O banco de dados rejeita qualquer tentativa de `DELETE` direto via API. |
| **ProteÃ§Ã£o Anti-Tamper / Root** | MethodChannel Kotlin inspeciona binÃ¡rios `su` e flags de emulador. | Registra incidente na tabela `audit_log` via chamada autenticada. | **Bom:** Cria trilha forense caso o terminal seja violado em campo. |

---

## 2. InventÃ¡rio de Controles de SeguranÃ§a Implementados

### 2.1 Controle de Acesso e GestÃ£o de SessÃ£o
- **Credenciais Seguras:** Nenhuma senha em texto puro trafega na rede ou Ã© persistida. O PIN de 6 dÃ­gitos do almoxarife e a senha de 4 dÃ­gitos do operÃ¡rio sÃ£o sempre transformados em SHA-256.
- **Armazenamento Criptografado:** UtilizaÃ§Ã£o de `FlutterSecureStorage` (que no Android utiliza `EncryptedSharedPreferences` com chaves no Android Keystore, e no iOS utiliza Keychain com proteÃ§Ã£o `kSecAttrAccessibleAfterFirstUnlock`).
- **Temporizador de Inatividade:** SessÃ£o monitorada a cada 30 segundos com expiraÃ§Ã£o configurada em 30 minutos de inatividade do usuÃ¡rio.

### 2.2 Auditoria Forense e Rastreabilidade
A cada movimentaÃ§Ã£o registrada no arquivo `lib/services/movimentacao_service.dart`, o aplicativo anexa metadados mandatÃ³rios:
- `usuario_nome`: Nome completo do almoxarife logado.
- `usuario_matricula`: NÃºmero de crachÃ¡ do operador.
- `device_id`: Identificador exclusivo de hardware do celular.
- `app_version`: VersÃ£o do aplicativo em execuÃ§Ã£o (ex: `1.0.0`).
- `os_platform`: IdentificaÃ§Ã£o da plataforma e versÃ£o do sistema operacional (ex: `Android 13`).
- `latitude` / `longitude`: Coordenadas de GPS com precisÃ£o mÃ©dia.
- `session_id`: UUID Ãºnico gerado no momento do login para rastrear todas as aÃ§Ãµes daquela jornada de trabalho.

### 2.3 Blindagem do Banco de Dados Supabase (Scripts 110 a 123)
- **Bloqueio de ExclusÃ£o FÃ­sica:** As tabelas `produtos`, `movimentacoes`, `estoque_atual` e `funcionarios` possuem comandos explÃ­citos de `REVOKE DELETE, TRUNCATE ON TABLE ... FROM anon, public;`.
- **ProteÃ§Ã£o de Colunas Confidenciais (LGPD):** Comandos explÃ­citos de `REVOKE SELECT (pin_hash, senha_movimentacao_hash) ON public.funcionarios FROM anon, public;` impedem que qualquer consulta PostgREST extraia as senhas dos colaboradores.
- **Triggers com `SECURITY DEFINER`:** As funÃ§Ãµes de automaÃ§Ã£o de saldo executam com os privilÃ©gios do proprietÃ¡rio do banco, garantindo atomicidade sem depender de permissÃµes excessivas na role anÃ´nima da API.

---

## 3. Riscos e Vulnerabilidades Identificados para a MigraÃ§Ã£o

1. **DependÃªncia da Role `anon` no Supabase Mobile:**
   - *DiagnÃ³stico:* O aplicativo mÃ³vel nÃ£o utiliza o mÃ³dulo GoTrue nativo (`supabase.auth.signUp` ou `signInWithPassword`), operando atravÃ©s de uma chave pÃºblica (`anonKey`) com autenticaÃ§Ã£o via RPC.
   - *Risco:* PolÃ­ticas de RLS precisam ser mantidas rigorosamente alinhadas entre `anon` e `authenticated` para evitar erros de permissÃ£o (como o erro 42501 recentemente solucionado).
   - *RecomendaÃ§Ã£o para React Native:* Avaliar a geraÃ§Ã£o de Custom JWTs no retorno da RPC de login para que o cliente React Native passe a operar como role autenticada no Supabase.

2. **ValidaÃ§Ã£o de Conformidade de EPI Apenas no Cliente:**
   - *DiagnÃ³stico:* A checagem de vencimento do CA do EPI ocorre exclusivamente no arquivo `saida_screen.dart:202-228`.
   - *Risco:* Se um usuÃ¡rio mal-intencionado fizer um POST direto no endpoint PostgREST de `movimentacoes`, a saÃ­da de um produto vencido seria aceita pelo banco.
   - *RecomendaÃ§Ã£o:* Criar um trigger `BEFORE INSERT` na tabela `movimentacoes` no PostgreSQL para validar se o produto Ã© EPI e se estÃ¡ vencido, rejeitando a operaÃ§Ã£o na raiz do banco de dados.

3. **InexistÃªncia de Constraint de Saldo MÃ­nimo no Banco:**
   - *DiagnÃ³stico:* A tabela `estoque_atual` nÃ£o possui constraint `CHECK (quantidade >= 0)`.
   - *Risco:* OperaÃ§Ãµes concorrentes ou requisiÃ§Ãµes forÃ§adas poderiam deixar o estoque negativo.
   - *RecomendaÃ§Ã£o:* Aplicar constraint de integridade no PostgreSQL para blindagem definitiva.