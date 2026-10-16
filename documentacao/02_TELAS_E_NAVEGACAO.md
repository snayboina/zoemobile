# 02 â€” TELAS E NAVEGAÃ‡ÃƒO DO APLICATIVO

## 1. InventÃ¡rio Geral de Telas
O aplicativo possui exatamente **14 telas** implementadas:

| # | Identificador de Rota | Nome da Tela | Arquivo Dart de Origem | Objetivo Principal |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `/` | SplashScreen | `lib/screens/splash/splash_screen.dart` | DecisÃ£o de fluxo inicial (SessÃ£o / Onboarding / Login / Pendente) |
| 2 | `/onboarding` | OnboardingScreen | `lib/features/onboarding/presentation/screens/onboarding_screen.dart` | ApresentaÃ§Ã£o institucional e benefÃ­cios do sistema |
| 3 | `/login` | LoginScreen | `lib/screens/auth/login_screen.dart` | AutenticaÃ§Ã£o por CrachÃ¡ e PIN de 6 dÃ­gitos com proteÃ§Ã£o contra forÃ§a bruta |
| 4 | `/pending-device` | PendingDeviceScreen | `lib/features/auth/presentation/screens/pending_device_screen.dart` | Bloqueio e aviso de aparelho aguardando aprovaÃ§Ã£o ou revogado |
| 5 | `/home` | HomeScreen | `lib/screens/home/home_screen.dart` | Dashboard operacional, atalhos, alerta de estoque baixo e status offline |
| 6 | `/scanner` | ScannerScreen | `lib/screens/scanner/scanner_screen.dart` | Leitura de cÃ³digo de barras e QR Code pela cÃ¢mera com bipe sonoro |
| 7 | `/entrada` | EntradaScreen | `lib/screens/movimentacao/entrada_screen.dart` | Registro de entradas avulsas ou por conferÃªncia no estoque |
| 8 | `/saida` | SaidaScreen | `lib/screens/movimentacao/saida_screen.dart` | SaÃ­da avulsa ou consumo com carrinho em lote, validaÃ§Ã£o de EPI e senha |
| 9 | `/devolucao` | DevolucaoScreen | `lib/screens/movimentacao/devolucao_screen.dart` | Retorno de materiais com listagem de pendÃªncias e assinatura por senha |
| 10 | `/movimentacoes` | MovimentacoesScreen | `lib/screens/movimentacao/movimentacoes_screen.dart` | HistÃ³rico recente de movimentaÃ§Ãµes filtrÃ¡vel por tipo (EN, SA, DV) |
| 11 | `/nada-consta` | NadaConstaScreen | `lib/screens/movimentacao/nada_consta_screen.dart` | Consulta de pendÃªncias do colaborador e emissÃ£o de status de quitaÃ§Ã£o |
| 12 | `/inventario` | InventarioScreen | `lib/screens/inventario/inventario_screen.dart` | Contagem fÃ­sica de estoque, reconciliaÃ§Ã£o e troca de prateleira |
| 13 | `/estoque-baixo` | EstoqueBaixoScreen | `lib/screens/estoque/estoque_baixo_screen.dart` | Listagem urgente de itens com saldo igual ou inferior ao estoque mÃ­nimo |
| 14 | `/localizacao` | LocalizacaoScreen | `lib/screens/localizacao/localizacao_screen.dart` | Localizador bimodal: onde estÃ¡ o produto e o que tem na prateleira |

---

## 2. Detalhamento FÃ­sico de Cada Tela

### 2.1 SplashScreen (`/`)
- **Arquivo:** `lib/screens/splash/splash_screen.dart`
- **Objetivo:** Inicializar o aplicativo, aguardar 2 segundos e validar o estado do dispositivo e da sessÃ£o armazenada para decidir a tela de destino.
- **Componentes:** `Scaffold`, `Image.asset('assets/icon.png')`, `Text('ZOESTOCK')`, `CircularProgressIndicator`.
- **Campos de Entrada:** Nenhum.
- **BotÃµes e AÃ§Ãµes:** Nenhuma aÃ§Ã£o manual do usuÃ¡rio.
- **ValidaÃ§Ãµes e LÃ³gica:**
  - Chama `authService.checkSession()`.
  - Se `devicePending` ou `deviceBlocked` -> Redireciona para `/pending-device`.
  - Se sessÃ£o vÃ¡lida (`user != null`) -> Redireciona para `/home`.
  - Se sem sessÃ£o -> LÃª `onboarding_completed` no `FlutterSecureStorage`. Se `true`, vai para `/login`; caso contrÃ¡rio, vai para `/onboarding`.
- **ServiÃ§os Chamados:** `AuthService`, `FlutterSecureStorage`.
- **Tabelas Supabase:** Consulta indireta via RPC `validar_login_funcionario` (se houver validaÃ§Ã£o de token).
- **Comportamento em React Native:** Hook `useEffect` que executa a checagem no carregamento inicial da Navigation Stack.

### 2.2 OnboardingScreen (`/onboarding`)
- **Arquivo:** `lib/features/onboarding/presentation/screens/onboarding_screen.dart`
- **Objetivo:** Guiar o novo usuÃ¡rio sobre as 4 propostas de valor do aplicativo atravÃ©s de um carrossel de slides.
- **Componentes:** `PageView.builder`, `AnimatedContainer` (indicadores de pÃ¡gina), botÃ£o circular de avanÃ§ar, botÃ£o "PULAR".
- **Campos de Entrada:** Nenhum.
- **AÃ§Ãµes:** "PULAR" ou botÃ£o "COMEÃ‡AR AGORA" no Ãºltimo slide grava `onboarding_completed = 'true'` no SecureStorage e navega para `/login`.
- **Dados:** Lista de 4 slides em `onboarding_data.dart` (Bem-vindo, Entradas e SaÃ­das, InventÃ¡rio em Tempo Real, SeguranÃ§a em Primeiro Lugar).
- **Comportamento em React Native:** Utilizar `react-native-pager-view` ou `FlatList` horizontal com paginaÃ§Ã£o nativa.

### 2.3 LoginScreen (`/login`)
- **Arquivo:** `lib/screens/auth/login_screen.dart`
- **Objetivo:** Autenticar o operador de estoque atravÃ©s do nÃºmero do CrachÃ¡/MatrÃ­cula e do PIN de seguranÃ§a de 6 dÃ­gitos.
- **Componentes:** `StockInput` (CrachÃ¡), seletor visual de 6 pontos para o PIN, teclado virtual na tela (`PinKeyboard`), indicador de bloqueio por forÃ§a bruta com cronÃ´metro regressivo.
- **Campos de Entrada:** `_crachaController` (Texto/NumÃ©rico), `_pin` (String de 6 dÃ­gitos alimentada pelo teclado customizado).
- **BotÃµes e AÃ§Ãµes:** BotÃ£o "Entrar" (`StockButton`), teclas 0-9, botÃ£o apagar e botÃ£o limpar do `PinKeyboard`.
- **ValidaÃ§Ãµes:**
  - CrachÃ¡ nÃ£o pode ser vazio.
  - O PIN deve ter exatamente 6 dÃ­gitos (`_pin.length == 6`).
  - Bloqueio de interface se o aparelho estiver temporariamente bloqueado por tentativas consecutivas incorretas.
- **ServiÃ§os Chamados:** `AuthService.login(cracha, pin)`.
- **Tabelas Supabase:** Executa RPC `validar_login_funcionario` com envio de metadados do aparelho e coordenadas GPS.
- **Comportamento em React Native:** Teclado numÃ©rico customizado em TypeScript com feedback tÃ¡til (`expo-haptics`).

### 2.4 PendingDeviceScreen (`/pending-device`)
- **Arquivo:** `lib/features/auth/presentation/screens/pending_device_screen.dart`
- **Objetivo:** Notificar o usuÃ¡rio que o aparelho fÃ­sico atual estÃ¡ aguardando homologaÃ§Ã£o do gestor ou foi bloqueado por motivos de seguranÃ§a.
- **Componentes:** Ãcone de escudo/bloqueio, texto explicativo, caixa com Device ID e modelo, botÃ£o "Verificar AprovaÃ§Ã£o", botÃ£o "Voltar ao Login".
- **AÃ§Ãµes:**
  - "Verificar AprovaÃ§Ã£o": Revalida o status no backend via `checkSession()`. Se aprovado, vai para a `/home`.
  - "Voltar ao Login": Limpa a sessÃ£o local via `logout()` e retorna a `/login`.
- **Comportamento em React Native:** ExibiÃ§Ã£o do UUID do aparelho capturado via `expo-application` / `expo-device`.

### 2.5 HomeScreen (`/home`)
- **Arquivo:** `lib/screens/home/home_screen.dart`
- **Objetivo:** Centro de comando do aplicativo. Apresenta saudaÃ§Ã£o, nome da empresa vinculada, banner de sincronizaÃ§Ã£o offline, alerta de estoque baixo e atalhos para os mÃ³dulos.
- **Componentes:**
  - `AppBar` com botÃµes de recarga e logout.
  - Banner de advertÃªncia de itens pendentes de sincronizaÃ§Ã£o com botÃ£o de "Sincronizar Agora".
  - SaudaÃ§Ã£o personalizada com crachÃ¡ e nome da empresa.
  - Componente `AlertEstoqueBaixo` (banner pulsante se houver produtos crÃ­ticos).
  - Grid com 8 `StockCard` (Entrada, SaÃ­da, DevoluÃ§Ã£o, InventÃ¡rio, MovimentaÃ§Ãµes, Scanner, LocalizaÃ§Ã£o, Nada Consta).
- **Regras e Temporizadores:**
  - Timer de verificaÃ§Ã£o de sessÃ£o a cada 30 segundos (`_sessionTimer`). Se a sessÃ£o expirar por inatividade ou revogaÃ§Ã£o, o usuÃ¡rio Ã© deslogado automaticamente.
  - Carregamento de dados em segundo plano (`Future.microtask`) para preencher o cache de produtos, prateleiras e funcionÃ¡rios.
  - Listener de toque na tela (`onPointerDown`) que renova o carimbo de Ãºltima interaÃ§Ã£o do usuÃ¡rio.
- **Comportamento em React Native:** Dashboard com `ScrollView` e `FlatList` em grade com monitoramento de ciclo de vida do app (`AppState`).

### 2.6 ScannerScreen (`/scanner`)
- **Arquivo:** `lib/screens/scanner/scanner_screen.dart`
- **Objetivo:** Fornecer visor de cÃ¢mera em tela cheia para leitura rÃ¡pida de cÃ³digos de barras (EAN-13, CODE-128) e QR Codes.
- **Componentes:** Widget `MobileScanner`, mira centralizada desenhada com bordas vermelhas, botÃ£o de alternar lanterna (Torch).
- **AÃ§Ãµes:** Ao capturar o cÃ³digo, dispara som de bipe industrial via MethodChannel `com.stockangel.app/beep`, vibra o celular (`HapticFeedback.lightImpact`) e fecha a tela retornando o valor em texto (`Navigator.pop(code)`).
- **Comportamento em React Native:** `expo-camera` ou `react-native-vision-camera` com Ã¡udio via `expo-av`.

### 2.7 EntradaScreen (`/entrada`)
- **Arquivo:** `lib/screens/movimentacao/entrada_screen.dart`
- **Objetivo:** LanÃ§ar entradas fÃ­sicas de mercadorias no almoxarifado (reposiÃ§Ãµes, compras avulsas ou acertos).
- **Componentes:** DropdownSearch com busca de produtos por nome ou cÃ³digo, seletor de quantidade (`QuantitySelector`), campo de observaÃ§Ã£o, checkbox de ajuste de inventÃ¡rio, botÃ£o "Confirmar Entrada".
- **Regras:**
  - Quantidade deve ser obrigatoriamente maior que zero.
  - O produto Ã© vinculado Ã  prateleira cadastrada.
  - Registra a movimentaÃ§Ã£o com tipo `EN`. O gatilho de banco `trg_update_estoque` soma a quantidade no saldo de `estoque_atual`.
- **Comportamento em React Native:** Modal de seleÃ§Ã£o pesquisÃ¡vel com `FlatList` virtualizada para alta performance.

### 2.8 SaidaScreen (`/saida`)
- **Arquivo:** `lib/screens/movimentacao/saida_screen.dart`
- **Objetivo:** Registrar saÃ­das de materiais com mÃ¡xima rastreabilidade, permitindo saÃ­das em lote (carrinho), validaÃ§Ã£o de EPI e exigÃªncia de senha do colaborador.
- **Componentes:**
  - Seletor de FuncionÃ¡rio com botÃ£o de escanear QR Code do crachÃ¡.
  - Card informativo com nome e setor do colaborador.
  - Multi-seleÃ§Ã£o de produtos via `DropdownSearch.multiSelection`.
  - Seletor de quantidade e campo de observaÃ§Ã£o.
  - Checkbox "Consumo" (indica material descartÃ¡vel/consumÃ­vel).
  - Lista de itens adicionados ao carrinho com opÃ§Ã£o de remoÃ§Ã£o individual.
  - DiÃ¡logo de validaÃ§Ã£o de senha de 4 dÃ­gitos do colaborador (`_pedirSenhaMovimentacao`).
  - DiÃ¡logo de cadastro inicial de senha (`_criarSenhaMovimentacao`) caso o colaborador ainda nÃ£o possua PIN.
  - Modal de advertÃªncia de bloqueio de EPI vencido (`_mostrarPopupBloqueado`).
- **Regras:**
  - Quantidade solicitada somada ao carrinho nÃ£o pode ultrapassar o saldo atual em estoque.
  - Se o produto tiver conformidade (CA ou aferiÃ§Ã£o) com `bloquear_vencido = true` e data vencida, o sistema bloqueia a inclusÃ£o no carrinho.
  - A saÃ­da gera movimentaÃ§Ãµes com tipo `SA` (ou `CONSUMO`).
- **Comportamento em React Native:** Carrinho persistido em estado global (Zustand) com validaÃ§Ãµes sÃ­ncronas antes da confirmaÃ§Ã£o.

### 2.9 DevolucaoScreen (`/devolucao`)
- **Arquivo:** `lib/screens/movimentacao/devolucao_screen.dart`
- **Objetivo:** Receber materiais de volta no estoque e dar baixa nas pendÃªncias do colaborador.
- **Componentes:**
  - Busca de colaborador por crachÃ¡ ou escaneamento de QR Code.
  - Painel de pendÃªncias atuais do colaborador carregado dinamicamente via `getPendenciasFuncionario()`.
  - ReordenaÃ§Ã£o automÃ¡tica da lista de produtos: os itens que o colaborador estÃ¡ devendo sÃ£o posicionados no topo da lista.
  - Campo de quantidade devolvida e observaÃ§Ã£o.
  - DiÃ¡logo de confirmaÃ§Ã£o de detalhes e exigÃªncia de senha de 4 dÃ­gitos do colaborador.
- **Regras:** Gera movimentaÃ§Ã£o com tipo `DV`, que atravÃ©s da trigger de banco incrementa o saldo fÃ­sico em `estoque_atual`.

### 2.10 MovimentacoesScreen (`/movimentacoes`)
- **Arquivo:** `lib/screens/movimentacao/movimentacoes_screen.dart`
- **Objetivo:** Exibir a lista das Ãºltimas 50 movimentaÃ§Ãµes realizadas pela empresa para conferÃªncia rÃ¡pida pelo operador.
- **Componentes:** Barra de filtros com chips horizontais ("Todos", "Entrada", "SaÃ­da", "DevoluÃ§Ã£o"), lista com cards estilizados por tipo (verde para EN, vermelho para SA, laranja para DV), indicador de data/hora formatada e nome do almoxarife.
- **Tabelas Supabase:** Consulta `movimentacoes` com embeds de `produtos(nome)` e `funcionarios(nome)`.

### 2.11 NadaConstaScreen (`/nada-consta`)
- **Arquivo:** `lib/screens/movimentacao/nada_consta_screen.dart`
- **Objetivo:** Consultar a situaÃ§Ã£o fiscal de um colaborador para homologaÃ§Ãµes de rescisÃ£o, transferÃªncias ou auditorias periÃ³dicas.
- **Componentes:** Campo de busca rÃ¡pida por matrÃ­cula ou leitor de QR Code, cartÃ£o de dados do colaborador, painel de status centralizado.
- **Regras:**
  - Se o saldo pendente (SaÃ­das - DevoluÃ§Ãµes) de todos os itens for zero -> Exibe selo verde "NADA CONSTA" (Colaborador nÃ£o possui pendÃªncias).
  - Se houver saldo pendente -> Lista os itens em vermelho com a quantidade em dÃ©bito (Ex: "Devendo: 2 UN").

### 2.12 InventarioScreen (`/inventario`)
- **Arquivo:** `lib/screens/inventario/inventario_screen.dart`
- **Objetivo:** Realizar a contagem fÃ­sica periÃ³dica de itens e regularizar discrepÃ¢ncias de saldo e localizaÃ§Ã£o fÃ­sica.
- **Componentes:**
  - Seletor de produto com exibiÃ§Ã£o do saldo registrado no sistema e prateleira atual.
  - Checkbox para habilitar transferÃªncia de prateleira fÃ­sica.
  - Seletor de prateleira destino.
  - Campo numÃ©rico para a quantidade fÃ­sica real encontrada.
  - Campo de observaÃ§Ã£o da contagem.
- **Regras:**
  - Se houver mudanÃ§a de prateleira: gera saÃ­da (`SA`) da prateleira antiga e entrada (`EN`) na nova prateleira com o novo saldo.
  - Se na mesma prateleira: calcula `diferenca = real - sistema`. Se positiva, lanÃ§a `EN`; se negativa, lanÃ§a `SA`.
  - Cria cabeÃ§alho na tabela `inventarios` e item detalhado em `inventario_itens`.

### 2.13 EstoqueBaixoScreen (`/estoque-baixo`)
- **Arquivo:** `lib/screens/estoque/estoque_baixo_screen.dart`
- **Objetivo:** Apresentar em lista de prioridade mÃ¡xima todos os produtos cujo estoque fÃ­sico atingiu ou caiu abaixo do estoque mÃ­nimo de seguranÃ§a.
- **Componentes:** Lista com cartÃµes de alerta em tom vermelho claro, identificaÃ§Ã£o do estoque atual vs estoque mÃ­nimo, localizaÃ§Ã£o da prateleira e chip "CRÃTICO".

### 2.14 LocalizacaoScreen (`/localizacao`)
- **Arquivo:** `lib/screens/localizacao/localizacao_screen.dart`
- **Objetivo:** Resolver a logÃ­stica fÃ­sica do galpÃ£o atravÃ©s de duas visÃµes (Abas):
  - **Aba 1 (Buscar Produto):** O operador escolhe o item e o app exibe a prateleira, zona e saldo atual.
  - **Aba 2 (Escanear/Buscar Prateleira):** O operador lÃª o cÃ³digo de barras da prateleira (ex: "A-01") ou seleciona da lista, e o app exibe todos os produtos estocados naquela posiÃ§Ã£o fÃ­sica especÃ­fica.

---

## 3. Mapa de NavegaÃ§Ã£o do ZoeStock
```mermaid
stateDiagram-v2
    [*] --> Splash
    Splash --> Onboarding : Primeiro acesso
    Splash --> Login : Sem sessÃ£o ativa
    Splash --> Home : SessÃ£o vÃ¡lida
    Splash --> PendingDevice : Dispositivo nÃ£o autorizado

    Onboarding --> Login : Ao concluir ou pular

    Login --> Home : Credenciais vÃ¡lidas
    Login --> PendingDevice : Aparelho pendente/bloqueado

    PendingDevice --> Login : Voltar

    Home --> Entrada
    Home --> Saida
    Home --> Devolucao
    Home --> Inventario
    Home --> Movimentacoes
    Home --> Scanner
    Home --> Localizacao
    Home --> NadaConsta
    Home --> EstoqueBaixo
    Home --> Login : Logout / Timeout

    Entrada --> Scanner : Ler Produto
    Saida --> Scanner : Ler CrachÃ¡
    Devolucao --> Scanner : Ler CrachÃ¡
    NadaConsta --> Scanner : Ler CrachÃ¡
    Localizacao --> Scanner : Ler Prateleira
```