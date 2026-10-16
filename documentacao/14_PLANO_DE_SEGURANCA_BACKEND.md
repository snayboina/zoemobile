# 14 â€” PLANO DE BLINDAGEM E SEGURANÃ‡A BACKEND (SUPABASE)

Este documento apresenta as especificaÃ§Ãµes tÃ©cnicas arquiteturais para mitigar os riscos crÃ­ticos identificados durante a auditoria, sem modificar a produÃ§Ã£o nesta fase, preparando o terreno para uma infraestrutura imune a fraudes na migraÃ§Ã£o React Native.

---

## 1. Problema 1: Bloqueio de EPI Vencido Exclusivo no Cliente

### DiagnÃ³stico do Risco
Atualmente, se um operador utilizar um script automatizado ou cliente HTTP enviando um `POST /rest/v1/movimentacoes`, o PostgreSQL aceita a inserÃ§Ã£o de saÃ­da (`SA`) de um EPI com CA ou calibraÃ§Ã£o vencidos, pois a validaÃ§Ã£o existe apenas no Flutter (`saida_screen.dart:202`).

### EspecificaÃ§Ã£o da CorreÃ§Ã£o no Backend (Trigger de ValidaÃ§Ã£o)
DeverÃ¡ ser criada uma funÃ§Ã£o de trigger `BEFORE INSERT` na tabela `movimentacoes` que atue como guardiÃ£ no banco de dados:

```sql
-- ESPECIFICAÃ‡ÃƒO TÃ‰CNICA (NÃƒO EXECUTAR EM PRODUÃ‡ÃƒO NESTA FASE)
CREATE OR REPLACE FUNCTION public.fn_validar_conformidade_epi_movimentacao()
RETURNS TRIGGER AS $$
DECLARE
  v_eh_epi BOOLEAN := false;
  v_bloquear BOOLEAN := true;
  v_tipo_controle TEXT;
  v_validade DATE;
  v_status_manual TEXT;
BEGIN
  -- Apenas saÃ­das e consumos sÃ£o auditados contra validade de EPI
  IF NEW.tipo IN ('SA', 'CONSUMO') THEN
    -- Busca dados de conformidade vinculados ao produto
    SELECT 
      COALESCE(p.eh_epi, false),
      COALESCE(pc.bloquear_vencido, true),
      pc.tipo_controle,
      CASE 
        WHEN pc.tipo_controle = 'CA' THEN pc.data_validade::date
        ELSE pc.data_proxima_afericao::date
      END,
      pc.status_manual
    INTO v_eh_epi, v_bloquear, v_tipo_controle, v_validade, v_status_manual
    FROM public.produtos p
    LEFT JOIN public.produto_conformidade pc ON pc.produto_id = p.id
    WHERE p.id = NEW.produto_id;

    -- 1. Trava se houver bloqueio manual de seguranÃ§a
    IF v_status_manual = 'BLOQUEADO' THEN
      RAISE EXCEPTION 'SAIDA BLOQUEADA: Produto com bloqueio manual de seguranÃ§a ativo.';
    END IF;

    -- 2. Trava se for EPI com controle vencido
    IF v_eh_epi AND v_bloquear AND v_validade IS NOT NULL AND v_validade < CURRENT_DATE THEN
      RAISE EXCEPTION 'SAIDA BLOQUEADA: EPI com controle (%) vencido em %.', v_tipo_controle, v_validade;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atrelamento:
-- CREATE TRIGGER trg_check_conformidade_epi
-- BEFORE INSERT ON public.movimentacoes
-- FOR EACH ROW EXECUTE FUNCTION public.fn_validar_conformidade_epi_movimentacao();
```

---

## 2. Problema 2: Riscos Associados Ã  Role `anon`

### DiagnÃ³stico do Risco
O aplicativo mÃ³vel opera com a chave pÃºblica anÃ´nima do Supabase (`anonKey`). Para permitir a leitura de produtos e gravaÃ§Ã£o de movimentaÃ§Ãµes, o Script 123 concedeu permissÃµes explÃ­citas para a role `anon`. Isso significa que qualquer agente com a `anonKey` do projeto pode realizar chamadas PostgREST diretas se nÃ£o houver filtragem restritiva no RLS.

### EspecificaÃ§Ã£o de MitigaÃ§Ã£o
1. **Curto Prazo (MigraÃ§Ã£o):** Manter o isolamento rigoroso via `empresa_id` em todas as policies de RLS:
   ```sql
   -- Em vez de USING (true), exigir empresa_id explÃ­cito se houver contexto de sessÃ£o:
   CREATE POLICY "Leitura restrita por empresa" ON public.produtos
   FOR SELECT TO anon, authenticated
   USING (empresa_id IS NOT NULL);
   ```
2. **MÃ©dio Prazo (RecomendaÃ§Ã£o Arquitetural):** Atualizar a RPC `validar_login_funcionario` para que ela gere um Custom JWT assinado pelo Supabase (contendo `sub`, `role: 'authenticated'`, `empresa_id`, `funcionario_id`). O cliente React Native passa a injetar esse JWT no cabeÃ§alho `Authorization: Bearer <token>`, permitindo que o RLS filtre automaticamente com `auth.jwt() ->> 'empresa_id'`.

---

## 3. Problema 3: OperaÃ§Ãµes Concorrentes e Saldo Negativo

### DiagnÃ³stico do Risco
A funÃ§Ã£o `update_estoque_balance()` atualiza o estoque com:
```sql
UPDATE public.estoque_atual 
SET quantidade = estoque_atual.quantidade - NEW.quantidade
WHERE produto_id = NEW.produto_id AND prateleira_id = NEW.prateleira_id;
```
Se duas saÃ­das simultÃ¢neas ocorrerem (ex: 2 almoxarifes retirando 5 unidades de um item que sÃ³ possui 6), o saldo final resultarÃ¡ em `-4`, pois nÃ£o existe trava de saldo no PostgreSQL.

### EspecificaÃ§Ã£o de MitigaÃ§Ã£o
1. **Constraint de NÃ£o Negatividade:**
   ```sql
   ALTER TABLE public.estoque_atual
   ADD CONSTRAINT chk_estoque_nao_negativo CHECK (quantidade >= 0);
   ```
2. **ValidaÃ§Ã£o na Trigger `update_estoque_balance()`:**
   Adicionar checagem antes do update:
   ```sql
   IF (v_saldo_atual - NEW.quantidade) < 0 THEN
     RAISE EXCEPTION 'SALDO INSUFICIENTE: O produto possui apenas % unidades em estoque.', v_saldo_atual;
   END IF;
   ```

---

## 4. Problema 4: AprovaÃ§Ã£o ProvisÃ³ria de Senha Offline

### DiagnÃ³stico do Risco
No arquivo `funcionario_service.dart:82-88`, quando o aparelho estÃ¡ sem conexÃ£o com a internet, o mÃ©todo `validarSenhaMovimentacao` intercepta o erro e retorna:
```dart
return {
  'success': true, 
  'offline': true,
  'message': 'Modo offline: ValidaÃ§Ã£o de senha adiada.'
};
```
Isso permite que um operador sem internet digite qualquer sequÃªncia de 4 dÃ­gitos e a retirada seja aceita localmente.

### EspecificaÃ§Ã£o de MitigaÃ§Ã£o no React Native
Em vez de aprovaÃ§Ã£o cega sem senha:
1. Ao sincronizar o catÃ¡logo de funcionÃ¡rios para o cache local, o app armazena um hash local derivado (`HMAC-SHA256` ou `Bcrypt local`) em armazenamento seguro (`expo-secure-store`).
2. Quando offline, o React Native valida a senha digitada contra o hash local armazenado do colaborador.
3. Se a senha conferir com o hash local -> aprova a transaÃ§Ã£o offline. Se nÃ£o conferir -> rejeita a transaÃ§Ã£o mesmo offline!