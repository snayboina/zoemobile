# 16 â€” MATRIZ DE TESTES DE REGRESSÃƒO E EQUIVALÃŠNCIA

Esta matriz especifica testes positivos e negativos para cada uma das 25 regras de negÃ³cio, definindo a condiÃ§Ã£o inicial, a entrada, o comportamento esperado e o critÃ©rio rigoroso de aprovaÃ§Ã£o na versÃ£o React Native.

---

### RN-001: AutenticaÃ§Ã£o por CrachÃ¡ e PIN 6D
- **Teste Positivo (CT-001-POS):**
  - *CondiÃ§Ã£o:* UsuÃ¡rio com crachÃ¡ "001" cadastrado, ativo e com PIN correto.
  - *Entrada:* CrachÃ¡ "001", PIN "123456".
  - *Resultado:* Login aprovado, sessÃ£o armazenada no SecureStore e redirecionamento para a Home.
  - *CritÃ©rio:* RPC `validar_login_funcionario` retorna `sucesso = true`.
- **Teste Negativo (CT-001-NEG):**
  - *CondiÃ§Ã£o:* UsuÃ¡rio digita PIN de 5 dÃ­gitos.
  - *Entrada:* CrachÃ¡ "001", PIN "12345".
  - *Resultado:* BotÃ£o entrar nÃ£o dispara requisiÃ§Ã£o; exibe alerta: "O PIN deve conter exatamente 6 dÃ­gitos."
  - *CritÃ©rio:* Nenhuma chamada de rede realizada; validaÃ§Ã£o puramente local.

---

### RN-002: ProteÃ§Ã£o contra ForÃ§a Bruta
- **Teste Positivo (CT-002-POS):**
  - *CondiÃ§Ã£o:* Operador digita credenciais corretas na primeira tentativa.
  - *Entrada:* PIN correto.
  - *Resultado:* Acesso imediato sem acionamento de timer.
- **Teste Negativo (CT-002-NEG):**
  - *CondiÃ§Ã£o:* Operador erra o PIN 5 vezes consecutivas.
  - *Entrada:* 5 tentativas incorretas.
  - *Resultado:* A tela bloqueia os campos e o botÃ£o por 15 minutos, exibindo contagem regressiva em formato MM:SS.
  - *CritÃ©rio:* O banco registra `blocked_until = now() + 15 min` e a API rejeita chamadas adicionais.

---

### RN-003: HomologaÃ§Ã£o ObrigatÃ³ria de Dispositivos (Whitelisting)
- **Teste Positivo (CT-003-POS):**
  - *CondiÃ§Ã£o:* Dispositivo com `device_id` com status `APROVADO` no Supabase.
  - *Entrada:* Login vÃ¡lido.
  - *Resultado:* Acesso liberado Ã  Home.
- **Teste Negativo (CT-003-NEG):**
  - *CondiÃ§Ã£o:* Dispositivo recÃ©m-instalado ou com status `PENDENTE`.
  - *Entrada:* Login vÃ¡lido.
  - *Resultado:* Redirecionamento forÃ§ado para `PendingDeviceScreen` com exibiÃ§Ã£o do UUID e botÃ£o de revalidaÃ§Ã£o.
  - *CritÃ©rio:* Nenhum dado de produtos Ã© exposto.

---

### RN-004: Auditoria de GeolocalizaÃ§Ã£o (GPS)
- **Teste Positivo (CT-004-POS):**
  - *CondiÃ§Ã£o:* PermissÃ£o de localizaÃ§Ã£o concedida e GPS ativado.
  - *Entrada:* ConfirmaÃ§Ã£o de saÃ­da de produto.
  - *Resultado:* Linha gravada em `movimentacoes` contÃ©m colunas `latitude` e `longitude` preenchidas com precisÃ£o mÃ©dia.
- **Teste Negativo (CT-004-NEG):**
  - *CondiÃ§Ã£o:* GPS desligado ou permissÃ£o negada pelo usuÃ¡rio.
  - *Entrada:* ConfirmaÃ§Ã£o de saÃ­da de produto.
  - *Resultado:* A movimentaÃ§Ã£o Ã© concluÃ­da com sucesso (nÃ£o bloqueante), gravando `latitude = NULL` e anotando recusa de permissÃ£o no log.

---

### RN-005: Encerramento de SessÃ£o por Inatividade
- **Teste Positivo (CT-005-POS):**
  - *CondiÃ§Ã£o:* UsuÃ¡rio interagindo com o aplicativo normalmente.
  - *Entrada:* Toques periÃ³dicos na tela.
  - *Resultado:* SessÃ£o permanece ativa indefinidamente.
- **Teste Negativo (CT-005-NEG):**
  - *CondiÃ§Ã£o:* Aplicativo aberto na Home sem qualquer toque por 30 minutos.
  - *Entrada:* Inatividade contÃ­nua.
  - *Resultado:* SessÃ£o Ã© revogada e o usuÃ¡rio Ã© redirecionado para a tela de Login com mensagem informativa.

---

### RN-006: Isolamento Multitenant por `empresa_id`
- **Teste Positivo (CT-006-POS):**
  - *CondiÃ§Ã£o:* Almoxarife da Empresa A logado.
  - *Entrada:* Consulta de produtos e histÃ³rico.
  - *Resultado:* Apenas itens pertencentes Ã  Empresa A sÃ£o exibidos.
- **Teste Negativo (CT-006-NEG):**
  - *CondiÃ§Ã£o:* Tentativa de buscar item com ID pertencente Ã  Empresa B.
  - *Entrada:* RequisiÃ§Ã£o forÃ§ada com `produto_id` de outro tenant.
  - *Resultado:* Query retorna zero registros ou erro de permissÃ£o.

---

### RN-007: ValidaÃ§Ã£o de Saldo FÃ­sico na SaÃ­da
- **Teste Positivo (CT-007-POS):**
  - *CondiÃ§Ã£o:* Produto com saldo fÃ­sico de 10 unidades.
  - *Entrada:* Adicionar 6 unidades ao carrinho.
  - *Resultado:* Item adicionado com sucesso.
- **Teste Negativo (CT-007-NEG):**
  - *CondiÃ§Ã£o:* Produto com saldo 10 e jÃ¡ 6 unidades no carrinho.
  - *Entrada:* Tentar adicionar mais 5 unidades do mesmo produto.
  - *Resultado:* RejeiÃ§Ã£o imediata com alerta: "A quantidade total de saÃ­da excede o estoque atual."

---

### RN-008: Modalidade de SaÃ­da (Normal vs Consumo)
- **Teste Positivo (CT-008-POS):**
  - *CondiÃ§Ã£o:* SeleÃ§Ã£o de produto cadastrado com `consumo = true`.
  - *Entrada:* Adicionar ao carrinho e confirmar saÃ­da.
  - *Resultado:* MovimentaÃ§Ã£o gravada com `tipo = 'CONSUMO'` (nÃ£o entra como pendÃªncia de devoluÃ§Ã£o).
- **Teste Negativo (CT-008-NEG):**
  - *CondiÃ§Ã£o:* Produto durÃ¡vel com `consumo = false`.
  - *Entrada:* SaÃ­da normal.
  - *Resultado:* Gravada com `tipo = 'SA'` (passa a constar nas pendÃªncias do funcionÃ¡rio).

---

### RN-009: Bloqueio de EPI com CA Vencido
- **Teste Positivo (CT-009-POS):**
  - *CondiÃ§Ã£o:* EPI com validade de CA futura (vÃ¡lida).
  - *Entrada:* Adicionar ao carrinho.
  - *Resultado:* InclusÃ£o permitida normalmente.
- **Teste Negativo (CT-009-NEG):**
  - *CondiÃ§Ã£o:* EPI com data de validade de CA anterior a hoje e `bloquear_vencido = true`.
  - *Entrada:* Tentar adicionar ao carrinho.
  - *Resultado:* Modal vermelho "SAÃDA BLOQUEADA: EPI com controle vencido" impede a inclusÃ£o.

---

### RN-010: Bloqueio Manual de SeguranÃ§a de Produto
- **Teste Positivo (CT-010-POS):**
  - *CondiÃ§Ã£o:* Produto com `status_manual = 'LIBERADO'` ou nulo.
  - *Entrada:* SaÃ­da de produto.
  - *Resultado:* OperaÃ§Ã£o permitida.
- **Teste Negativo (CT-010-NEG):**
  - *CondiÃ§Ã£o:* Produto com `status_manual = 'BLOQUEADO'`.
  - *Entrada:* Tentativa de movimentaÃ§Ã£o.
  - *Resultado:* Modal de advertÃªncia bloqueando a saÃ­da.

---

### RN-011: Assinatura EletrÃ´nica por Senha 4D
- **Teste Positivo (CT-011-POS):**
  - *CondiÃ§Ã£o:* Colaborador com PIN cadastrado.
  - *Entrada:* Digitar os 4 dÃ­gitos corretos no modal.
  - *Resultado:* RPC `validar_senha_movimentacao` retorna sucesso e a saÃ­da Ã© processada.
- **Teste Negativo (CT-011-NEG):**
  - *CondiÃ§Ã£o:* Digitar senha incorreta.
  - *Entrada:* PIN divergente.
  - *Resultado:* Alerta vermelho "Senha incorreta", transaÃ§Ã£o abortada e nada inserido no banco.

---

### RN-012: Cadastro Inicial de Senha de MovimentaÃ§Ã£o
- **Teste Positivo (CT-012-POS):**
  - *CondiÃ§Ã£o:* Colaborador novo sem senha cadastrada (`senha_movimentacao_hash IS NULL`).
  - *Entrada:* Digitar "5544" e confirmar "5544".
  - *Resultado:* RPC `cadastrar_senha_movimentacao_inicial` grava o hash Bcrypt e autoriza a movimentaÃ§Ã£o.
- **Teste Negativo (CT-012-NEG):**
  - *CondiÃ§Ã£o:* Senhas divergentes nos campos de criaÃ§Ã£o.
  - *Entrada:* "1234" e "1235".
  - *Resultado:* Alerta: "As senhas digitadas nÃ£o coincidem."

---

### RN-013: Fila de MovimentaÃ§Ãµes Offline
- **Teste Positivo (CT-013-POS):**
  - *CondiÃ§Ã£o:* Celular em Modo AviÃ£o (sem rede).
  - *Entrada:* Confirmar saÃ­da com senha.
  - *Resultado:* Registro salvo na fila local, alerta "Registros salvos offline!", banner na Home exibindo "1 SincronizaÃ§Ã£o Pendente".
- **Teste de RecuperaÃ§Ã£o (CT-013-REC):**
  - *CondiÃ§Ã£o:* Desativar Modo AviÃ£o.
  - *Entrada:* Aguardar 30s ou clicar em "Sincronizar".
  - *Resultado:* Envio bem-sucedido para `movimentacoes`, esvaziamento da fila local e banner ocultado.

---

### RN-014: InventÃ¡rio com TransferÃªncia de Prateleira
- **Teste Positivo (CT-014-POS):**
  - *CondiÃ§Ã£o:* Item na Prateleira A com saldo 8. Contagem fÃ­sica encontra 6 unidades na Prateleira B.
  - *Entrada:* Checkbox "Mudar Prateleira", destino B, qtd 6.
  - *Resultado:* Gera saÃ­da de 8 na Prateleira A e entrada de 6 na Prateleira B.
- **Teste Negativo (CT-014-NEG):**
  - *CondiÃ§Ã£o:* SeleÃ§Ã£o da mesma prateleira com a flag de mudanÃ§a marcada.
  - *Resultado:* Sistema trata como ajuste regular sem gerar saÃ­da/entrada duplicadas.

---

### RN-015: InventÃ¡rio com Ajuste AutomÃ¡tico de Saldo
- **Teste Positivo (CT-015-POS):**
  - *CondiÃ§Ã£o:* Saldo sistema: 12. Contagem fÃ­sica: 15.
  - *Entrada:* Salvar inventÃ¡rio na mesma prateleira.
  - *Resultado:* Gera movimentaÃ§Ã£o `EN` de 3 unidades com observaÃ§Ã£o "Ajuste de inventÃ¡rio". Saldo final vai para 15.
- **Teste Negativo (CT-015-NEG):**
  - *CondiÃ§Ã£o:* Quantidade fÃ­sica negativa (ex: -2).
  - *Resultado:* ValidaÃ§Ã£o bloqueia o envio com alerta: "A quantidade nÃ£o pode ser negativa."

---

### RN-016: CÃ¡lculo de PendÃªncias (Nada Consta)
- **Teste Positivo (CT-016-POS):**
  - *CondiÃ§Ã£o:* Colaborador retirou 3 capacetes e devolveu 3 capacetes.
  - *Entrada:* Consulta de crachÃ¡ no Nada Consta.
  - *Resultado:* Selo verde central "NADA CONSTA - Colaborador nÃ£o possui pendÃªncias."
- **Teste Negativo (CT-016-NEG):**
  - *CondiÃ§Ã£o:* Colaborador retirou 2 furadeiras e devolveu 0.
  - *Resultado:* CartÃ£o vermelho destacando: "Furadeira - Devendo: 2 UN".

---

### RN-017: ReordenaÃ§Ã£o Inteligente na DevoluÃ§Ã£o
- **Teste Positivo (CT-017-POS):**
  - *CondiÃ§Ã£o:* Colaborador selecionado deve um item cujo nome comeÃ§a com "Z".
  - *Entrada:* Abrir seletor de produtos.
  - *Resultado:* O item com a letra "Z" aparece no topo da lista com destaque visual de prioridade.

---

### RN-018: SanitizaÃ§Ã£o de MatrÃ­cula no Scanner
- **Teste Positivo (CT-018-POS):**
  - *CondiÃ§Ã£o:* QR Code de crachÃ¡ impresso com prefixo: `"MATR-88421-ZOE"`.
  - *Entrada:* Leitura pelo scanner.
  - *Resultado:* Regex extrai unicamente `"88421"`, preenche o campo e localiza o colaborador sem erro.

---

### RN-019: AtualizaÃ§Ã£o AtÃ´mica de Saldo por Trigger
- **Teste Positivo (CT-019-POS):**
  - *CondiÃ§Ã£o:* Saldo atual: 50.
  - *Entrada:* INSERT direto de movimentaÃ§Ã£o `EN` com quantidade 10.
  - *Resultado:* Tabela `estoque_atual` reflete 60 imediatamente via trigger `trg_update_estoque`.

---

### RN-020: HeranÃ§a de `empresa_id` em MovimentaÃ§Ã£o Ã“rfÃ£
- **Teste Positivo (CT-020-POS):**
  - *CondiÃ§Ã£o:* Payload de inserÃ§Ã£o enviado sem a chave `empresa_id`.
  - *Entrada:* INSERT em `movimentacoes` apenas com `produto_id`.
  - *Resultado:* Trigger `trigger_set_empresa_movimentacao` consulta o produto e grava o `empresa_id` correto.

---

### RN-021: Alerta de Estoque MÃ­nimo
- **Teste Positivo (CT-021-POS):**
  - *CondiÃ§Ã£o:* Produto com estoque mÃ­nimo 10 e saldo atual 8.
  - *Entrada:* Carregamento da Home.
  - *Resultado:* Banner de estoque baixo visÃ­vel. NavegaÃ§Ã£o para `/estoque-baixo` exibe o produto com chip "CRÃTICO".

---

### RN-022: Busca Bimodal de LocalizaÃ§Ã£o
- **Teste Positivo (CT-022-POS):**
  - *CondiÃ§Ã£o:* Produto alocado no Corredor 2, Prateleira B-04.
  - *Entrada:* Aba 1 busca produto -> Exibe "B-04 (Zona Sul)"; Aba 2 seleciona "B-04" -> Lista todos os itens alocados lÃ¡.

---

### RN-023: DetecÃ§Ã£o de Root e Emulador
- **Teste Positivo (CT-023-POS):**
  - *CondiÃ§Ã£o:* Celular fÃ­sico nÃ£o roteado.
  - *Resultado:* VerificaÃ§Ã£o passa com `isSecure = true`.
- **Teste Negativo (CT-023-NEG):**
  - *CondiÃ§Ã£o:* Aparelho com binÃ¡rio `/system/bin/su` ou rodando em emulador.
  - *Resultado:* Dispara log forense em `audit_log` (`vulnerability_detected`) e alerta a seguranÃ§a.

---

### RN-024: ExclusÃ£o LÃ³gica Geral (Soft Delete)
- **Teste Positivo (CT-024-POS):**
  - *CondiÃ§Ã£o:* Produto excluÃ­do logicamente (`excluido = true`) no painel web.
  - *Entrada:* Abrir seletores no app mÃ³vel.
  - *Resultado:* O produto nÃ£o aparece nos seletores de saÃ­da ou entrada.
- **Teste HistÃ³rico (CT-024-HIS):**
  - *Resultado:* No extrato de movimentaÃ§Ãµes antigas, o nome do produto continua sendo exibido normalmente via join.

---

### RN-025: Cache Local e Fallback Offline
- **Teste Positivo (CT-025-POS):**
  - *CondiÃ§Ã£o:* App carregou produtos online e teve o sinal cortado.
  - *Entrada:* Abrir tela de localizaÃ§Ã£o ou saÃ­da sem rede.
  - *Resultado:* Os produtos sÃ£o recuperados do snapshot local sem erro de conexÃ£o.