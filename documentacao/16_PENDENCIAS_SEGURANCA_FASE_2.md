# 🔒 REVISÃO TÉCNICA DE PENDÊNCIAS DE SEGURANÇA — FASE 2
## ZOESTOCK MOBILE (MIGRAÇÃO FLUTTER → REACT NATIVE)

**Data da Auditoria:** 16 de Outubro de 2026  
**Status do Repositório:** `feature/fase-3-componentes-ui`  
**Engenheiro Responsável:** Agente Sênior de Engenharia de Software  
**Regra Mandatória:** Somente diagnóstico e recomendações arquiteturais. Não alterar o banco de dados Supabase de produção nem aplicar correções sem autorização prévia.

---

## 1. INTRODUÇÃO E ESCOPO DA REVISÃO

Durante a conclusão da **Fase 2 (Migração dos Serviços de Domínio, Integração Supabase e Sincronização Offline)**, foram mapeados pontos de atenção estruturais relacionados ao tráfego de dados, persistência local de contingência, integridade transacional e controle de acesso a RPCs.

Este documento consolida a revisão técnica dos quatro vetores críticos apontados:
1. **Idempotência Efetiva no Backend** (mitigação de duplicação em saídas offline/online).
2. **Autorização das RPCs e Isolamento Multiempresa** (Row Level Security e tenant leak).
3. **Tratamento de PIN e Criptografia SHA-256** (vetores de brute force e tráfego de credenciais).
4. **Proteção de Dados no Armazenamento Local Offline** (AsyncStorage não criptografado e dados sensíveis).

---

## 2. ANÁLISE DOS VETORES DE RISCO

### 2.1. Idempotência Efetiva no Backend

#### Contexto Técnico:
O aplicativo móvel opera em almoxarifados industriais com conectividade intermitente. Quando o operador registra uma saída de material ou EPI no modo offline, a operação é enfileirada no `StorageAdapter` local com um UUID gerado no cliente (`id`). Ao restabelecer a conexão, o `SyncService` descarrega a fila disparando chamadas ao Supabase.

#### Risco Identificado:
Se houver falha de rede temporária (timeout após o backend processar o INSERT/RPC mas antes do cliente receber o `200 OK`), o sincronizador tentará reenviar a mesma movimentação. Se o backend não possuir restrição única ou controle de idempotência baseado no `id` da movimentação, o estoque poderá sofrer duplo decremento indevido.

#### Recomendações Arquiteturais para o Backend:
1. **Chave de Idempotência no PostgreSQL:**
   - Garantir que a tabela `movimentacoes` possua `id UUID PRIMARY KEY` fornecido pelo cliente ou coluna `client_transaction_id UUID UNIQUE`.
   - Adicionar cláusula `ON CONFLICT (id) DO NOTHING` nas transações ou verificar existência antes de recalcular saldo de prateleira/produto.
2. **Transação Atômica em RPC:**
   - A criação de movimentação e atualização de saldo deve ocorrer estritamente dentro de uma transação SQL atômica com isolamento adequado (`SERIALIZABLE` ou `READ COMMITTED` com `SELECT FOR UPDATE` na linha do produto).

---

### 2.2. Autorização das RPCs e Isolamento Multiempresa (Multi-Tenant)

#### Contexto Técnico:
O sistema atende múltiplos clientes corporativos sob o modelo multiempresa (`empresa_id`). A autenticação e as operações críticas operam via funções remotas (RPCs), tais como `validar_login_funcionario` e `cadastrar_pin_funcionario`.

#### Risco Identificado:
1. Se as RPCs forem declaradas com `SECURITY DEFINER` (padrão comum no PostgreSQL/Supabase para contornar permissões de leitura direta de senhas), elas operam com os privilégios do superusuário do banco.
2. Caso os parâmetros de entrada da RPC (`p_empresa_id`, `p_funcionario_id`) não sejam estritamente validados contra o contexto de sessão autenticada (`auth.jwt() -> app_metadata / user_metadata`), um operador mal-intencionado autenticado de uma empresa A poderia invocar a RPC passando o identificador de uma empresa B.

#### Recomendações Arquiteturais para o Backend:
1. **Validação Rígida nas RPCs:**
   - Injetar no cabeçalho das RPCs `SECURITY DEFINER`:
     ```sql
     IF auth.role() = 'authenticated' AND (auth.jwt() ->> 'empresa_id')::uuid <> p_empresa_id THEN
       RAISE EXCEPTION 'Acesso negado: Tentativa de violação de isolamento multiempresa.';
     END IF;
     ```
2. **Revisão de Políticas RLS no Schema `public`:**
   - Garantir que todas as tabelas (`produtos`, `movimentacoes`, `inventarios`, `funcionarios`, `prateleiras`) possuam RLS ativo com checagem obrigatória:
     ```sql
     CREATE POLICY "Isolamento multiempresa estrito"
     ON public.nome_da_tabela
     FOR ALL
     TO authenticated
     USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
     WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);
     ```

---

### 2.3. Tratamento de PIN e Uso de SHA-256

#### Contexto Técnico:
A autenticação rápida de operadores e almoxarifes em campo utiliza um PIN numérico de 4 dígitos. No cliente, a função `sha256(pin.trim())` em TypeScript converte os 4 dígitos em uma hash hexadecimal antes do envio para a RPC `validar_login_funcionario`.

#### Risco Identificado:
1. **Espaço de Busca Restrito (PIN 4 Dígitos):** Um PIN de 4 dígitos possui apenas 10.000 combinações possíveis (0000 a 9999). Um hash SHA-256 não salgado de 4 dígitos pode ser quebrado em milissegundos via rainbow tables ou ataque de dicionário.
2. **Armazenamento de Senha:** Se o banco de dados armazena o SHA-256 simples sem salt exclusivo por funcionário, qualquer vazamento de banco de dados comprometeria todos os PINs.

#### Mitigações Implementadas no Frontend (Fases 2 e 3):
- O componente `PinKeyboard` **NUNCA** imprime o PIN em logs, telemetria nem salva em cache.
- O componente possui bloqueio de tentativas e desabilitação durante processamento.
- O PIN é retornado apenas em memória volátil via callback transitório.

#### Recomendações Arquiteturais para o Backend:
1. **Migração para Algoritmo Robusto com Salt no Banco:**
   - O backend deve receber o hash de transporte e aplicar `pgcrypto.crypt(hash_transporte, gen_salt('bf', 10))` (bcrypt) ou armazenar salt aleatório por funcionário.
2. **Rate Limiting e Bloqueio Progressivo:**
   - A RPC já implementa `bloqueado_ate` e `tentativas_restantes`. Recomenda-se estender o bloqueio com atraso exponencial (ex: 3 falhas = 5 min, 5 falhas = 30 min, 7 falhas = bloqueio administrativo).

---

### 2.4. Proteção dos Dados no Armazenamento Offline

#### Contexto Técnico:
Para garantir a operação contínua em almoxarifados sem sinal de internet, o `StorageAdapter` salva produtos, prateleiras, dados de sessão ativa e fila de movimentações não sincronizadas no `AsyncStorage`.

#### Risco Identificado:
O `AsyncStorage` armazena strings em texto claro no sandbox local do dispositivo (SQLite no Android / arquivo plist no iOS). Em aparelhos com root habilitado, jailbreak ou backups desprotegidos, esses dados podem ser inspecionados.

#### Mitigações Implementadas no Frontend:
1. **Nenhum PIN ou Senha no Storage:** Conforme arquitetura definida na Fase 2, o PIN nunca é persistido localmente.
2. **Particionamento por Tenant:** As chaves locais utilizam prefixo rígido de tenant (`tenant_${empresaId}_${key}`), permitindo limpeza atômica via `clearTenantData(empresaId)` no logout.

#### Recomendações para Fases Futuras (Fase 4 / Pré-Produção):
1. Avaliar a adoção de `expo-secure-store` para chaves criptográficas de sessão e tokens JWT.
2. Caso seja exigido pelo cliente corporativo nível de segurança militar para a base offline, avaliar criptografia simétrica AES-GCM da base de dados offline através de chave derivada armazenada no KeyStore / Keychain nativo.

---

## 3. MATRIZ DE RISCO CONSOLIDADA

| Item | Vetor de Risco | Severidade | Probabilidade | Mitigação Atual no Mobile | Ação Recomendada no Backend |
|---|---|---|---|---|---|
| **01** | Duplo decremento de estoque por repetição offline | ALTA | MÉDIA | UUID local único gerado por transação | Restrição `UNIQUE` / Chave de Idempotência |
| **02** | Violação de tenant multiempresa via RPC | CRÍTICA | BAIXA | Envio explícito de `empresa_id` da sessão | Validação de `auth.jwt()` dentro da RPC |
| **03** | Brute-force em PIN de 4 dígitos | ALTA | MÉDIA | Mascaramento, zero log, debounce no teclado | Bcrypt com salt no banco + rate limiting estrito |
| **04** | Acesso físico a dados em dispositivos rooteados | MÉDIA | BAIXA | Particionamento por tenant, zero PIN em disco | `expo-secure-store` para credenciais críticas |

---

## 4. CONCLUSÃO TÉCNICA

O código do novo aplicativo React Native (**ZOESTOCK Mobile**) foi desenvolvido com todas as travas possíveis no lado do cliente: sanitização de entrada, mascaramento estrito de PIN, barreira contra múltiplos disparos, isolamento de tenant local e auditoria com telemetria detalhada de cada transação.

As vulnerabilidades residuais decorrem da natureza arquitetural distribuída cliente/servidor e devem ser homologadas no backend Supabase por meio de migrações e auditoria de RLS quando autorizado pela liderança de TI.
