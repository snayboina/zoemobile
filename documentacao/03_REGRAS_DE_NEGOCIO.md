# 03 â€” REGRAS DE NEGÃ“CIO CATALOGADAS

Este documento mapeia todas as regras de negÃ³cio identificadas na inspeÃ§Ã£o do cÃ³digo-fonte, formalizadas com IDs Ãºnicos para assegurar total rastreabilidade durante a futura migraÃ§Ã£o para React Native.

---

### RN-001: AutenticaÃ§Ã£o de Operador por CrachÃ¡ e PIN de 6 DÃ­gitos
- **Objetivo:** Garantir a identificaÃ§Ã£o segura do operador de almoxarifado impedindo o uso de senhas fracas ou alfanumÃ©ricas complexas no ambiente operacional.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/features/auth/domain/usecases/login_usecase.dart`, `lib/screens/auth/login_screen.dart:74-95`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** SubmissÃ£o do formulÃ¡rio de login.
- **Dados Utilizados:** MatrÃ­cula/CrachÃ¡ (`cracha`) e PIN numÃ©rico de 6 dÃ­gitos (`pin`).
- **Resultado Esperado:** GeraÃ§Ã£o de hash SHA-256 do PIN e invocaÃ§Ã£o da RPC `validar_login_funcionario`. Retorna sessÃ£o com dados do funcionÃ¡rio e empresa vinculada.
- **ConsequÃªncia de Descumprimento:** Operador nÃ£o entra no sistema. PIN com menos de 6 dÃ­gitos Ã© barrado antes do envio Ã  rede.
- **Criticidade:** Alta.
- **Requisitos React Native:** ValidaÃ§Ã£o via Zod no schema de login; hash SHA-256 via `expo-crypto`.
- **Teste NecessÃ¡rio:** Tentar login com 5 dÃ­gitos (deve barrar localmente); tentar login com PIN correto (deve autorizar).

---

### RN-002: ProteÃ§Ã£o Progressiva contra ForÃ§a Bruta no Login
- **Objetivo:** Impedir ataques de adivinhaÃ§Ã£o de PIN no dispositivo fÃ­sico.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/auth/login_screen.dart:52-70, 102-115`, `lib/services/auth_service.dart:35-40`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Erros consecutivos na tentativa de autenticaÃ§Ã£o.
- **Dados Utilizados:** Contador `failedAttempts` e timestamp de bloqueio `blockedUntil`.
- **Resultado Esperado:** A interface desabilita os campos e o botÃ£o "Entrar", exibindo um cronÃ´metro regressivo com os segundos restantes.
- **ConsequÃªncia de Descumprimento:** O operador fica impedido de submeter credenciais atÃ© que o tempo expire.
- **Criticidade:** Alta.
- **Requisitos React Native:** Estado de bloqueio persistido e gerenciado por timer regressivo em hook customizado.
- **Teste NecessÃ¡rio:** Simular 3 e 5 falhas sucessivas de PIN e validar se o cronÃ´metro trava a tela.

---

### RN-003: HomologaÃ§Ã£o ObrigatÃ³ria de Dispositivos MÃ³veis (Device Whitelisting)
- **Objetivo:** Restringir o acesso ao aplicativo apenas a celulares/coletores previamente autorizados pelo administrador da empresa no Painel Web.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/features/auth/data/datasources/auth_remote_datasource.dart:9-43`, `lib/services/auth_service.dart:96-102`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** ValidaÃ§Ã£o da resposta da RPC `validar_login_funcionario`.
- **Dados Utilizados:** `device_id`, modelo, fabricante e sistema operacional enviados no payload.
- **Resultado Esperado:** Se o backend retornar status `dispositivo_pendente`, o app direciona para a tela de espera. Se retornar `dispositivo_bloqueado`, bloqueia permanentemente o uso.
- **ConsequÃªncia de Descumprimento:** Nenhum dado operacional Ã© baixado ou sincronizado se o aparelho nÃ£o for aprovado.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** Captura de Device ID imutÃ¡vel e tratamento explÃ­cito dos cÃ³digos de erro da RPC.
- **Teste NecessÃ¡rio:** Login em aparelho novo nÃ£o cadastrado deve cair automaticamente na tela `PendingDeviceScreen`.

---

### RN-004: Auditoria Georreferenciada ObrigatÃ³ria (GPS)
- **Objetivo:** Registrar a localizaÃ§Ã£o fÃ­sica real do operador no momento do login e de cada movimentaÃ§Ã£o de estoque para coibir fraudes geogrÃ¡ficas.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/services/movimentacao_service.dart:17-26, 48-49`, `lib/features/auth/data/repositories/auth_repository_impl.dart:238-245`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Disparo de login ou gravaÃ§Ã£o de movimentaÃ§Ã£o.
- **Dados Utilizados:** Latitude e Longitude obtidos via `Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium, timeLimit: 3s)`.
- **Resultado Esperado:** Coordenadas anexadas no JSON da movimentaÃ§Ã£o gravada em `movimentacoes`.
- **ConsequÃªncia de Descumprimento:** Falha de GPS nÃ£o interrompe a operaÃ§Ã£o (captura em bloco `try/catch` tolerante), mas registra `null` e anota no log se houver recusa de permissÃ£o.
- **Criticidade:** MÃ©dia.
- **Requisitos React Native:** ObtenÃ§Ã£o de posiÃ§Ã£o com `expo-location` respeitando timeout de 3 segundos para nÃ£o travar a UI.
- **Teste NecessÃ¡rio:** Realizar movimentaÃ§Ã£o com GPS ativado e validar preenchimento de latitude/longitude no banco.

---

### RN-005: Encerramento de SessÃ£o por Inatividade
- **Objetivo:** Proteger o terminal do almoxarife contra acessos nÃ£o autorizados caso o celular seja deixado sobre a bancada.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/home/home_screen.dart:35-50, 137-140`, `lib/services/auth_service.dart:184-210`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** AusÃªncia de eventos de toque na tela por perÃ­odo superior ao limite configurado (default: 30 minutos).
- **Dados Utilizados:** Carimbo de data/hora da Ãºltima interaÃ§Ã£o do usuÃ¡rio (`_lastInteraction`).
- **Resultado Esperado:** O timer periÃ³dico a cada 30 segundos detecta inatividade, limpa a sessÃ£o em memÃ³ria e redireciona para a tela de Login com mensagem de aviso.
- **ConsequÃªncia de Descumprimento:** O almoxarifado fica vulnerÃ¡vel a lanÃ§amentos indevidos.
- **Criticidade:** Alta.
- **Requisitos React Native:** Monitoramento global via PanResponder ou componente Root Container que registra timestamp de toque.
- **Teste NecessÃ¡rio:** ForÃ§ar expiraÃ§Ã£o de tempo e verificar se o app volta para a tela de login.

---

### RN-006: Isolamento Estrito de Multitenancy por Empresa (`empresa_id`)
- **Objetivo:** Impedir qualquer vazamento ou mistura de dados entre empresas clientes no mesmo banco Supabase.
- **LocalizaÃ§Ã£o no CÃ³digo:** Todos os serviÃ§os: `produto_service.dart:67, 99, 120`, `movimentacao_service.dart:66, 85`, `prateleira_service.dart:20`, `funcionario_service.dart:22, 44`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Todas as queries SELECT, INSERT e UPDATE.
- **Dados Utilizados:** `_authService.currentFuncionario?.empresaId`.
- **Resultado Esperado:** A clÃ¡usula `.eq('empresa_id', empresaId)` Ã© injetada obrigatoriamente em todas as requisiÃ§Ãµes pelo aplicativo.
- **ConsequÃªncia de Descumprimento:** RejeiÃ§Ã£o pelo banco via RLS ou exibiÃ§Ã£o indevida de dados de terceiros.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** CriaÃ§Ã£o de camada de repositÃ³rio centralizada que injeta automaticamente o `empresa_id` em toda query.
- **Teste NecessÃ¡rio:** Tentar buscar produtos ou movimentaÃ§Ãµes sem `empresa_id` e comprovar o bloqueio.

---

### RN-007: ValidaÃ§Ã£o de Saldo FÃ­sico na SaÃ­da com Suporte a Carrinho
- **Objetivo:** Impedir saldo negativo ou saÃ­da de produtos inexistentes no estoque fÃ­sico.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:189-200`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** AdiÃ§Ã£o de item ao carrinho de saÃ­da.
- **Dados Utilizados:** `quantidade` solicitada, `prod.estoqueAtual` e somatÃ³rio dos itens jÃ¡ enfileirados no carrinho para aquele mesmo `produto_id`.
- **Resultado Esperado:** Se `quantidade + qtdNoCarrinho > prod.estoqueAtual`, exibe erro em tela e rejeita a adiÃ§Ã£o.
- **ConsequÃªncia de Descumprimento:** Furo de estoque e estoque negativo no banco.
- **Criticidade:** Alta.
- **Requisitos React Native:** CÃ¡lculo em tempo real no store do carrinho antes do dispatch da aÃ§Ã£o.
- **Teste NecessÃ¡rio:** Produto com saldo 5: tentar adicionar 4 e depois mais 2 no mesmo carrinho (o segundo deve ser rejeitado).

---

### RN-008: Modalidade de SaÃ­da (Normal vs Consumo)
- **Objetivo:** Diferenciar saÃ­das de equipamentos reutilizÃ¡veis/rastreÃ¡veis de insumos de consumo imediato (pregos, fitas, luvas descartÃ¡veis).
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:284, 444-447`, `lib/models/produto_model.dart:43`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** SeleÃ§Ã£o de produto ou marcaÃ§Ã£o manual do checkbox de consumo.
- **Dados Utilizados:** Campo `consumo` da tabela `produtos`.
- **Resultado Esperado:** Se todos os produtos selecionados possuÃ­rem `consumo = true`, a flag `_isConsumo` Ã© ativada automaticamente. Gera tipo de movimentaÃ§Ã£o `CONSUMO` em vez de `SA`.
- **ConsequÃªncia de Descumprimento:** Itens de consumo ficariam constando como pendÃªncias de devoluÃ§Ã£o na ficha do funcionÃ¡rio.
- **Criticidade:** Alta.
- **Requisitos React Native:** LÃ³gica automÃ¡tica de detecÃ§Ã£o de consumo na seleÃ§Ã£o de itens.
- **Teste NecessÃ¡rio:** Selecionar produto com flag de consumo e validar se a movimentaÃ§Ã£o Ã© gravada como `CONSUMO`.

---

### RN-009: Bloqueio de SaÃ­da de EPI com Conformidade / CA Vencido
- **Objetivo:** Evitar multas trabalhistas e garantir a integridade fÃ­sica do trabalhador, bloqueando a entrega de EPIs fora do prazo de validade legal.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:202-228`, `lib/models/produto_model.dart:99-123`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Tentativa de inclusÃ£o de produto no carrinho de saÃ­da.
- **Dados Utilizados:** Objeto `produto_conformidade` vinculado ao produto: `tipo_controle` ('CA' ou aferiÃ§Ã£o periÃ³dica), `data_validade`, `data_proxima_afericao` e flag `bloquear_vencido`.
- **Resultado Esperado:** Se a data for anterior ao dia atual (`validade.isBefore(DateTime.now())`) e `bloquear_vencido == true`, exibe modal vermelho bloqueando a saÃ­da.
- **ConsequÃªncia de Descumprimento:** Entrega de EPI irregular ao trabalhador.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** FunÃ§Ã£o utilitÃ¡ria pura de checagem de conformidade com teste unitÃ¡rio obrigatÃ³rio.
- **Teste NecessÃ¡rio:** Produto com CA com data de ontem deve ter a saÃ­da bloqueada imediatamente com alerta em tela.

---

### RN-010: Bloqueio Manual de SeguranÃ§a de Produtos
- **Objetivo:** Permitir que o gestor ou tÃ©cnico de seguranÃ§a bloqueie preventivamente um lote de produtos com suspeita de defeito direto no Painel Web.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:212-215`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** InclusÃ£o do produto no carrinho de saÃ­da.
- **Dados Utilizados:** Campo `status_manual` da tabela `produto_conformidade`.
- **Resultado Esperado:** Se `status_manual == 'BLOQUEADO'`, a interface exibe o diÃ¡logo `_mostrarPopupBloqueado` e nÃ£o permite a movimentaÃ§Ã£o.
- **ConsequÃªncia de Descumprimento:** DistribuiÃ§Ã£o de produtos interditados.
- **Criticidade:** Alta.
- **Requisitos React Native:** VerificaÃ§Ã£o da flag `status_manual` no seletor de produtos.
- **Teste NecessÃ¡rio:** Produto com status manual bloqueado nÃ£o pode ser adicionado ao carrinho em hipÃ³tese alguma.

---

### RN-011: Assinatura EletrÃ´nica de MovimentaÃ§Ã£o por Senha do Colaborador
- **Objetivo:** Comprovar judicial e operacionalmente que o colaborador esteve presente e anuiu com a retirada ou devoluÃ§Ã£o do material.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:266, 687-776`, `lib/screens/movimentacao/devolucao_screen.dart:130, 260-350`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Clique em "Confirmar SaÃ­da" ou "Confirmar DevoluÃ§Ã£o".
- **Dados Utilizados:** Senha de 4 nÃºmeros digitada no diÃ¡logo e hash gravado em `funcionarios.senha_movimentacao_hash`.
- **Resultado Esperado:** Chamada da RPC `validar_senha_movimentacao`. Se a senha conferir, a movimentaÃ§Ã£o Ã© gravada; se falhar, a operaÃ§Ã£o Ã© abortada.
- **ConsequÃªncia de Descumprimento:** Impedir retiradas fraudulentas por terceiros usando o crachÃ¡ alheio.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** Modal de senha de 4 dÃ­gitos com digitaÃ§Ã£o mascarada e envio de hash SHA-256.
- **Teste NecessÃ¡rio:** Digitar senha errada (deve dar erro); digitar senha correta (deve registrar transaÃ§Ã£o).

---

### RN-012: Primeiro Cadastro de Senha de MovimentaÃ§Ã£o (Onboarding do Colaborador)
- **Objetivo:** Permitir que o prÃ³prio operÃ¡rio cadastre seu PIN pessoal no primeiro atendimento no almoxarifado, sem intervenÃ§Ã£o de TI.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:689-691, 778-891`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Tentativa de movimentaÃ§Ã£o para colaborador cujo campo `senha_movimentacao` seja nulo ou vazio.
- **Dados Utilizados:** Dois campos de texto para senha e confirmaÃ§Ã£o de 4 dÃ­gitos.
- **Resultado Esperado:** Se os campos forem idÃªnticos e contiverem 4 nÃºmeros, invoca a RPC `cadastrar_senha_movimentacao_inicial` e prossegue com a operaÃ§Ã£o.
- **ConsequÃªncia de Descumprimento:** Se nÃ£o houver conexÃ£o com a internet na primeira criaÃ§Ã£o, a operaÃ§Ã£o avisa que a internet Ã© mandatÃ³ria no primeiro cadastro.
- **Criticidade:** Alta.
- **Requisitos React Native:** Fluxo condicional de criaÃ§Ã£o de senha antes do fluxo de validaÃ§Ã£o.
- **Teste NecessÃ¡rio:** Colaborador sem senha deve abrir o modal de cadastro automaticamente ao tentar retirar produto.

---

### RN-013: TolerÃ¢ncia a Falhas e Fila Offline (Offline-First)
- **Objetivo:** Garantir que o trabalho de entrega e devoluÃ§Ã£o nunca pare por instabilidade de sinal de internet.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/services/sync_service.dart:69-138`, `lib/core/exceptions.dart`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Falha na requisiÃ§Ã£o de rede ao salvar movimentaÃ§Ã£o.
- **Dados Utilizados:** Modelo completo `MovimentacaoModel` serializado em JSON.
- **Resultado Esperado:** A transaÃ§Ã£o Ã© adicionada Ã  fila `_movimentacoesOffline` gravada em SharedPreferences. O app notifica o usuÃ¡rio ("Dispositivo sem internet. Registros salvos offline!"). Um timer periÃ³dico a cada 30 segundos tenta esvaziar a fila assim que a conexÃ£o retornar.
- **ConsequÃªncia de Descumprimento:** Perda de registros se o aplicativo for fechado.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** Motor de sincronizaÃ§Ã£o offline baseado em AsyncStorage ou MMKV com listener de rede `@react-native-community/netinfo`.
- **Teste NecessÃ¡rio:** Ativar Modo AviÃ£o, registrar saÃ­da de produto, desativar Modo AviÃ£o e confirmar envio automÃ¡tico ao banco.

---

### RN-014: InventÃ¡rio com TransferÃªncia FÃ­sica de Prateleira
- **Objetivo:** Corrigir localizaÃ§Ã£o fÃ­sica de produtos encontrados em prateleiras erradas durante a contagem.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/inventario/inventario_screen.dart:128-163`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Checkbox "Mudar Prateleira" marcado com seleÃ§Ã£o de prateleira destino diferente da atual.
- **Dados Utilizados:** Prateleira atual, prateleira destino, estoque anterior e quantidade fÃ­sica contada.
- **Resultado Esperado:** O sistema gera duas movimentaÃ§Ãµes encadeadas:
  1. SaÃ­da (`SA`) na prateleira antiga com a quantidade total anterior (zerando a localizaÃ§Ã£o antiga).
  2. Entrada (`EN`) na prateleira nova com a quantidade fÃ­sica contada.
- **ConsequÃªncia de Descumprimento:** Duplicidade de saldo fÃ­sico ou itens perdidos no galpÃ£o.
- **Criticidade:** Alta.
- **Requisitos React Native:** ExecuÃ§Ã£o transacional das duas movimentaÃ§Ãµes.
- **Teste NecessÃ¡rio:** Item de 10 unidades na Prateleira A transferido para B com 8 unidades reais (deve zerar A e criar saldo 8 em B).

---

### RN-015: InventÃ¡rio com Ajuste AutomÃ¡tico de Saldo
- **Objetivo:** Equalizar o saldo do sistema com a contagem fÃ­sica real do almoxarifado.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/inventario/inventario_screen.dart:164-180`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** FinalizaÃ§Ã£o de contagem na mesma prateleira com quantidade fÃ­sica diferente do sistema.
- **Dados Utilizados:** `diferenca = quantidadeReal - estoqueAtual`.
- **Resultado Esperado:**
  - Se `diferenca > 0`: gera movimentaÃ§Ã£o de Entrada (`EN`) com `diferenca.abs()`.
  - Se `diferenca < 0`: gera movimentaÃ§Ã£o de SaÃ­da (`SA`) com `diferenca.abs()`.
  - Anota observaÃ§Ã£o: `"Ajuste de inventÃ¡rio: ..."`.
- **ConsequÃªncia de Descumprimento:** DivergÃªncia contÃ­nua entre contabilidade e almoxarifado.
- **Criticidade:** Alta.
- **Requisitos React Native:** CÃ¡lculo matemÃ¡tico automÃ¡tico e geraÃ§Ã£o do tipo de movimentaÃ§Ã£o apropriado.
- **Teste NecessÃ¡rio:** Sistema marcava 20, contagem achou 15 -> deve gerar saÃ­da `SA` de 5 unidades.

---

### RN-016: CÃ¡lculo de PendÃªncias de Colaborador (Nada Consta)
- **Objetivo:** Determinar exatamente quais ferramentas e equipamentos estÃ£o sob a custÃ³dia do colaborador em tempo real.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/services/movimentacao_service.dart:79-115`, `lib/screens/movimentacao/nada_consta_screen.dart:44-58`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Consulta na tela de Nada Consta ou abertura da tela de DevoluÃ§Ã£o.
- **Dados Utilizados:** HistÃ³rico da tabela `movimentacoes` filtrado por `funcionario_id` e tipos `SA` e `DV`.
- **Resultado Esperado:**
  - Para cada `produto_id`: `saldo_pendente = sum(SA) - sum(DV)`.
  - Se `saldo_pendente > 0`, o item entra na lista de pendÃªncias ativas.
- **ConsequÃªncia de Descumprimento:** Colaboradores desligados levando materiais da empresa.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** AgregaÃ§Ã£o precisa via JavaScript/TypeScript ou via View/RPC do PostgreSQL.
- **Teste NecessÃ¡rio:** Colaborador que retirou 2 furadeiras e devolveu 1 deve constar devendo exatamente 1 furadeira.

---

### RN-017: ReordenaÃ§Ã£o Inteligente de Produtos na DevoluÃ§Ã£o
- **Objetivo:** Reduzir o tempo de atendimento na bancada de devoluÃ§Ã£o colocando no topo da lista os itens que o colaborador efetivamente deve.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/devolucao_screen.dart:67-76`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Carregamento das pendÃªncias do colaborador selecionado.
- **Dados Utilizados:** Lista `_pendencias` e catÃ¡logo geral `_produtos`.
- **Resultado Esperado:** A lista de seleÃ§Ã£o de produtos sofre sort dinÃ¢mico: itens com pendÃªncia ativa recebem prioridade mÃ¡xima (-1); os demais itens sÃ£o ordenados alfabeticamente.
- **ConsequÃªncia de Descumprimento:** Almoxarife perde tempo rolando centenas de itens para achar o equipamento a devolver.
- **Criticidade:** MÃ©dia (UX Operacional).
- **Requisitos React Native:** ImplementaÃ§Ã£o de algoritmo de sorting customizado no seletor.
- **Teste NecessÃ¡rio:** Colaborador deve um produto da letra Z; esse produto deve aparecer na primeira linha da lista.

---

### RN-018: ExtraÃ§Ã£o e HigienizaÃ§Ã£o de MatrÃ­cula no Leitor de CÃ³digo
- **Objetivo:** Garantir a leitura bem-sucedida de crachÃ¡s mesmo quando o QR Code ou cÃ³digo de barras contÃ©m prefixos, URLs ou caracteres extras.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/movimentacao/saida_screen.dart:385-400`, `lib/screens/movimentacao/devolucao_screen.dart:240-255`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Retorno de leitura de cÃ³digo pelo `ScannerScreen`.
- **Dados Utilizados:** String crua do cÃ³digo lido (`code`).
- **Resultado Esperado:** AplicaÃ§Ã£o de Regex `RegExp(r'\d+')` para extrair a sequÃªncia numÃ©rica contÃ­nua mais longa contida no cÃ³digo.
- **ConsequÃªncia de Descumprimento:** Falha na identificaÃ§Ã£o do crachÃ¡ caso o leitor capture caracteres de formataÃ§Ã£o da grÃ¡fica.
- **Criticidade:** Alta.
- **Requisitos React Native:** FunÃ§Ã£o utilitÃ¡ria de sanitizaÃ§Ã£o Regex executada no callback do leitor.
- **Teste NecessÃ¡rio:** CÃ³digo lido: `"FUNC-0012345-BR"` -> deve extrair automaticamente `"0012345"`.

---

### RN-019: AtualizaÃ§Ã£o AtÃ´mica de Saldo por Trigger de Banco (`trg_update_estoque`)
- **Objetivo:** Garantir que o saldo fÃ­sico em `estoque_atual` nunca fique defasado em relaÃ§Ã£o ao histÃ³rico de movimentaÃ§Ãµes.
- **LocalizaÃ§Ã£o no CÃ³digo:** `c:\arquivo backup pc\SISTEMAS FRANCIS\stockangel-main\stockangel-main\Supabase-Sql\46_fix_trigger_automacao_saldo_empresa.sql`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Disparo de INSERT na tabela `movimentacoes`.
- **Dados Utilizados:** `NEW.tipo`, `NEW.produto_id`, `NEW.prateleira_id`, `NEW.quantidade`, `NEW.empresa_id`.
- **Resultado Esperado:** Se tipo for `EN` ou `DV`, incrementa saldo no `estoque_atual`; se tipo for `SA` ou `CONSUMO`, subtrai o saldo. Executa em nÃ­vel de banco de dados (`AFTER INSERT`).
- **ConsequÃªncia de Descumprimento:** InconsistÃªncia irreparÃ¡vel entre saldo e extrato.
- **Criticidade:** CrÃ­tica.
- **Requisitos React Native:** Nenhuma lÃ³gica de cÃ¡lculo manual no cliente; confiar na trigger do Supabase.
- **Teste NecessÃ¡rio:** LanÃ§ar uma saÃ­da de 2 itens e validar se a tabela `estoque_atual` decresceu exatamente 2 unidades.

---

### RN-020: HeranÃ§a AutomÃ¡tica de `empresa_id` em MovimentaÃ§Ãµes Ã“rfÃ£s
- **Objetivo:** Proteger a integridade do multitenant caso o payload do aplicativo contenha `empresa_id` nulo.
- **LocalizaÃ§Ã£o no CÃ³digo:** `Supabase-Sql/38_fix_movimentacao_mobile_empresa.sql:12-27`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Disparo de INSERT na tabela `movimentacoes` com `empresa_id IS NULL`.
- **Dados Utilizados:** `produto_id` e `funcionario_id`.
- **Resultado Esperado:** A trigger `trigger_set_empresa_movimentacao` busca a empresa Ã  qual o produto pertence e injeta o ID correto antes de gravar a linha.
- **ConsequÃªncia de Descumprimento:** MovimentaÃ§Ãµes Ã³rfÃ£s invisÃ­veis no painel web da empresa.
- **Criticidade:** Alta.
- **Requisitos React Native:** O app deve enviar explicitamente o `empresa_id`, mantendo a trigger como proteÃ§Ã£o de segundo nÃ­vel.
- **Teste NecessÃ¡rio:** InserÃ§Ã£o direta sem empresa deve ser corrigida pela trigger no PostgreSQL.

---

### RN-021: Monitoramento e Alerta de Estoque MÃ­nimo de SeguranÃ§a
- **Objetivo:** Notificar o operador sobre a iminÃªncia de desabastecimento de itens crÃ­ticos.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/services/produto_service.dart:114-132`, `lib/screens/home/home_screen.dart:103-108`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Carregamento da tela inicial (Home).
- **Dados Utilizados:** ComparaÃ§Ã£o `p.estoqueAtual <= p.estoqueMinimo`.
- **Resultado Esperado:** Se houver produtos com saldo crÃ­tico, o card de alerta na Home fica visÃ­vel e permite navegar para a listagem detalhada `/estoque-baixo`.
- **ConsequÃªncia de Descumprimento:** Falta de insumos na linha de produÃ§Ã£o por falta de aviso.
- **Criticidade:** MÃ©dia.
- **Requisitos React Native:** Componente Banner de Alerta reativo baseado em estado global de produtos.
- **Teste NecessÃ¡rio:** Alterar estoque de um item para valor menor que o mÃ­nimo e verificar se o banner aparece na Home.

---

### RN-022: Busca e LocalizaÃ§Ã£o Bimodal no Almoxarifado
- **Objetivo:** Atender Ã s duas necessidades espaciais do operador: saber onde guardar um item e saber o que estÃ¡ guardado em um local.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/screens/localizacao/localizacao_screen.dart:50-110`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Acesso Ã  tela de LocalizaÃ§Ã£o.
- **Dados Utilizados:** AssociaÃ§Ã£o entre `produtos` e `prateleiras`.
- **Resultado Esperado:**
  - Modo 1: Escolhe produto -> exibe endereÃ§o fÃ­sico cadastrado (`A-01`, Zona Norte).
  - Modo 2: Escaneia ou escolhe prateleira -> executa `getProdutosByPrateleira()` e lista todos os itens alocados nela com seus saldos.
- **ConsequÃªncia de Descumprimento:** DesorganizaÃ§Ã£o espacial no armazÃ©m.
- **Criticidade:** MÃ©dia.
- **Requisitos React Native:** Interface em abas (Tab View) com suporte a leitor de cÃ³digo em ambas.
- **Teste NecessÃ¡rio:** Escanear o cÃ³digo de uma prateleira e validar a listagem de todos os produtos alocados nela.

---

### RN-023: Bloqueio de ExecuÃ§Ã£o em Ambientes Comprometidos (Anti-Root / Emulador)
- **Objetivo:** Evitar que invasores utilizem dispositivos com privilÃ©gios de root para burlar assinaturas eletrÃ´nicas ou interceptar credenciais.
- **LocalizaÃ§Ã£o no CÃ³digo:** `android/app/src/main/kotlin/.../MainActivity.kt:36-102`, `lib/features/auth/data/repositories/auth_repository_impl.dart:204-229`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** InicializaÃ§Ã£o do app e checagem periÃ³dica.
- **Dados Utilizados:** Canais nativos inspecionando binÃ¡rios `su`, flags de emulador e modo desenvolvedor.
- **Resultado Esperado:** Se detectado ambiente vulnerÃ¡vel, registra log de incidente forense `vulnerability_detected` e impede operaÃ§Ãµes de risco.
- **ConsequÃªncia de Descumprimento:** Comprometimento da integridade jurÃ­dica das assinaturas digitais de entrega de EPI.
- **Criticidade:** Alta.
- **Requisitos React Native:** Bibliotecas equivalentes como `react-native-jail-monkey` ou checagem nativa customizada.
- **Teste NecessÃ¡rio:** ExecuÃ§Ã£o em emulador com Root deve registrar evento na tabela `audit_log`.

---

### RN-024: ExclusÃ£o LÃ³gica Geral (Soft Delete)
- **Objetivo:** Garantir a rastreabilidade histÃ³rica impedindo que a exclusÃ£o de um produto ou funcionÃ¡rio quebre o histÃ³rico de movimentaÃ§Ãµes antigas.
- **LocalizaÃ§Ã£o no CÃ³digo:** Todas as consultas: `.eq('excluido', false)`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Toda consulta de listagem de entidades.
- **Dados Utilizados:** Coluna booleana `excluido` presente em `produtos`, `funcionarios`, `prateleiras`.
- **Resultado Esperado:** Registros marcados como excluÃ­dos nunca aparecem nos seletores do aplicativo mÃ³vel, mas permanecem visÃ­veis nos relatÃ³rios de movimentaÃ§Ãµes histÃ³ricas.
- **ConsequÃªncia de Descumprimento:** Perda de integridade referencial ou desaparecimento de nomes em relatÃ³rios antigos.
- **Criticidade:** Alta.
- **Requisitos React Native:** Filtro `.eq('excluido', false)` incorporado obrigatoriamente nos repositÃ³rios.
- **Teste NecessÃ¡rio:** Excluir produto no painel web; validar que ele desaparece do seletor do app mÃ³vel.

---

### RN-025: Cache Local Criptografado e Snapshot de Apoio
- **Objetivo:** Permitir consulta instantÃ¢nea de catÃ¡logos e operaÃ§Ã£o em locais de baixa conectividade.
- **LocalizaÃ§Ã£o no CÃ³digo:** `lib/services/sync_service.dart:140-209`.
- **CondiÃ§Ãµes de AtivaÃ§Ã£o:** Retorno bem-sucedido de chamadas ao Supabase.
- **Dados Utilizados:** Snapshots JSON de produtos, funcionÃ¡rios e prateleiras.
- **Resultado Esperado:** Toda vez que o app baixa os dados online, salva uma cÃ³pia localmente. Se a conexÃ£o cair, os seletores utilizam o cache sem interromper a tela.
- **ConsequÃªncia de Descumprimento:** Telas em branco e travamentos caso o sinal de internet oscile durante o atendimento.
- **Criticidade:** Alta.
- **Requisitos React Native:** ImplementaÃ§Ã£o de polÃ­tica de cache "Stale-While-Revalidate" ou persistÃªncia via AsyncStorage.
- **Teste NecessÃ¡rio:** Abrir a tela com internet, desligar a rede, reabrir a tela e comprovar que os produtos continuam listados.