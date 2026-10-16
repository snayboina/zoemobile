# 01 â€” ARQUITETURA ATUAL (FLUTTER / DART)

## 1. Mapeamento Estrutural do CÃ³digo-Fonte
O projeto Flutter estÃ¡ estruturado no padrÃ£o modular orientado a camadas de domÃ­nio e componentes visuais, com aplicaÃ§Ã£o de Clean Architecture no mÃ³dulo de autenticaÃ§Ã£o:

```text
lib/
â”œâ”€â”€ core/                                    # Fundamentos globais e utilitÃ¡rios
â”‚   â”œâ”€â”€ app_colors.dart                      # Design Tokens de cores institucionais
â”‚   â”œâ”€â”€ app_routes.dart                      # DicionÃ¡rio central de rotas de navegaÃ§Ã£o
â”‚   â”œâ”€â”€ app_theme.dart                       # ConfiguraÃ§Ã£o de temas Material Design
â”‚   â”œâ”€â”€ exceptions.dart                      # Classes de exceÃ§Ã£o de domÃ­nio (OfflineQueueException)
â”‚   â””â”€â”€ supabase_config.dart                 # InicializaÃ§Ã£o do client Supabase via .env
â”‚
â”œâ”€â”€ features/                                # MÃ³dulos estruturados em Clean Architecture
â”‚   â”œâ”€â”€ auth/                                # AutenticaÃ§Ã£o, gestÃ£o de dispositivos e seguranÃ§a
â”‚   â”‚   â”œâ”€â”€ data/
â”‚   â”‚   â”‚   â”œâ”€â”€ datasources/                 # auth_local_datasource.dart, auth_remote_datasource.dart
â”‚   â”‚   â”‚   â”œâ”€â”€ models/                      # auth_result_model.dart, device_model.dart
â”‚   â”‚   â”‚   â””â”€â”€ repositories/                # auth_repository_impl.dart
â”‚   â”‚   â”œâ”€â”€ domain/
â”‚   â”‚   â”‚   â”œâ”€â”€ entities/                    # session_info.dart
â”‚   â”‚   â”‚   â”œâ”€â”€ repositories/                # auth_repository.dart
â”‚   â”‚   â”‚   â””â”€â”€ usecases/                    # login_usecase.dart, check_session_usecase.dart, biometric_login_usecase.dart
â”‚   â”‚   â””â”€â”€ presentation/
â”‚   â”‚       â”œâ”€â”€ screens/                     # pending_device_screen.dart
â”‚   â”‚       â””â”€â”€ widgets/                     # pin_keyboard.dart (teclado virtual)
â”‚   â”‚
â”‚   â””â”€â”€ onboarding/                          # ApresentaÃ§Ã£o inicial do aplicativo
â”‚       â”œâ”€â”€ data/                            # onboarding_data.dart (slides e benefÃ­cios)
â”‚       â””â”€â”€ presentation/
â”‚           â”œâ”€â”€ screens/                     # onboarding_screen.dart
â”‚           â””â”€â”€ widgets/                     # onboarding_page.dart
â”‚
â”œâ”€â”€ models/                                  # Entidades e DTOs de dados
â”‚   â”œâ”€â”€ funcionario_model.dart               # Modelo de Colaboradores e senhas
â”‚   â”œâ”€â”€ inventario_model.dart                # Registro e cabeÃ§alho de contagens
â”‚   â”œâ”€â”€ movimentacao_model.dart              # TransaÃ§Ãµes (EN, SA, DV, CONSUMO) e auditoria
â”‚   â”œâ”€â”€ prateleira_model.dart                # EndereÃ§amento fÃ­sico e zonas
â”‚   â”œâ”€â”€ produto_model.dart                   # Itens, saldos, estoque mÃ­nimo e conformidade
â”‚   â””â”€â”€ usuario_model.dart                   # UsuÃ¡rio administrativo
â”‚
â”œâ”€â”€ screens/                                 # Interfaces de usuÃ¡rio e controladores
â”‚   â”œâ”€â”€ auth/                                # login_screen.dart
â”‚   â”œâ”€â”€ estoque/                             # estoque_baixo_screen.dart
â”‚   â”œâ”€â”€ home/                                # home_screen.dart
â”‚   â”œâ”€â”€ inventario/                          # inventario_screen.dart
â”‚   â”œâ”€â”€ localizacao/                         # localizacao_screen.dart
â”‚   â”œâ”€â”€ movimentacao/                        # entrada_screen.dart, saida_screen.dart, devolucao_screen.dart, movimentacoes_screen.dart, nada_consta_screen.dart
â”‚   â”œâ”€â”€ scanner/                             # scanner_screen.dart (leitor de cÃ³digo de barras/QR)
â”‚   â””â”€â”€ splash/                              # splash_screen.dart (decisÃ£o de roteamento inicial)
â”‚
â”œâ”€â”€ services/                                # ServiÃ§os de infraestrutura e regras de negÃ³cio
â”‚   â”œâ”€â”€ auth_service.dart                    # Estado reativo da sessÃ£o, timeout e auditoria
â”‚   â”œâ”€â”€ funcionario_service.dart             # Busca de crachÃ¡ e RPCs de senhas
â”‚   â”œâ”€â”€ inventario_service.dart              # PersistÃªncia de contagens fÃ­sicas no Supabase
â”‚   â”œâ”€â”€ movimentacao_service.dart            # InserÃ§Ã£o e consulta de transaÃ§Ãµes
â”‚   â”œâ”€â”€ prateleira_service.dart              # Consulta de localizaÃ§Ãµes fÃ­sicas
â”‚   â”œâ”€â”€ produto_service.dart                 # Consulta de produtos, estoque baixo e prateleiras
â”‚   â””â”€â”€ sync_service.dart                    # Fila offline e sincronizaÃ§Ã£o periÃ³dica (30s)
â”‚
â”œâ”€â”€ widgets/                                 # Componentes reutilizÃ¡veis
â”‚   â”œâ”€â”€ alert_estoque_baixo.dart             # Card de alerta dinÃ¢mico
â”‚   â”œâ”€â”€ quantity_selector.dart               # Incrementador/decrementador numÃ©rico
â”‚   â”œâ”€â”€ stock_button.dart                    # BotÃ£o com loading state embutido
â”‚   â”œâ”€â”€ stock_card.dart                      # CartÃ£o com Ã­cone para grid da Home
â”‚   â””â”€â”€ stock_input.dart                     # Campo de texto padronizado com Ã­cones
â”‚
â””â”€â”€ main.dart                                # Ponto de entrada, injeÃ§Ã£o de dependÃªncias e rotas
```

---

## 2. PadrÃµes Arquiteturais e Responsabilidades
1. **Clean Architecture (no mÃ³dulo `auth`):**
   - **Domain:** Totalmente isolado de bibliotecas externas; declara casos de uso (`LoginUseCase`, `CheckSessionUseCase`, `BiometricLoginUseCase`), entidades puras (`SessionInfo`) e contratos abstratos de repositÃ³rio (`AuthRepository`).
   - **Data:** Implementa fontes de dados locais (`FlutterSecureStorage`) e remotas (RPC Supabase `validar_login_funcionario`).
   - **Presentation:** Controladores reativos integrados Ã  Ã¡rvore de widgets com teclado virtual e telas especializadas.
2. **Provider Pattern (InjeÃ§Ã£o de DependÃªncias e Estado):**
   - No arquivo `lib/main.dart`, um `MultiProvider` configura:
     - `SyncService` (ChangeNotifierProvider) com loop autÃ´nomo iniciado na montagem.
     - `AuthService` (ChangeNotifierProvider) controlando o ciclo de vida do usuÃ¡rio autenticado.
     - `ProxyProvider2` para injetar instÃ¢ncias de `SyncService` e `AuthService` em `FuncionarioService`, `ProdutoService`, `MovimentacaoService`, `PrateleiraService` e `InventarioService`.
3. **PadrÃ£o Offline-First HÃ­brido:**
   - As consultas a produtos, prateleiras e funcionÃ¡rios tentam primeiro o Supabase; em caso de falha de conexÃ£o, recuperam o Ãºltimo snapshot salvo em cache local via `SharedPreferences`.
   - As escritas em `movimentacoes` interceptam erros de conexÃ£o disparando a exceÃ§Ã£o `OfflineQueueException`, que grava os dados na fila persistente `movimentacoes_offline` e exibe aviso em tela.

---

## 3. Camada Nativa e MethodChannels (Android)
No arquivo `android/app/src/main/kotlin/com/stockangel/stockangel_mobile/MainActivity.kt`, herdeiro de `FlutterFragmentActivity`:
1. **Canal de Ãudio Industrial (`com.stockangel.app/beep`):**
   - Utiliza `android.media.ToneGenerator(AudioManager.STREAM_MUSIC, 100)` disparando `TONE_PROP_BEEP` por 150 milissegundos para gerar o som caracterÃ­stico de coletores industriais ao ler cÃ³digos.
2. **Canal de DetecÃ§Ã£o de SeguranÃ§a e Anti-Tamper (`com.stockangel.app/security`):**
   - MÃ©todo `isRooted()`: Varre a presenÃ§a fÃ­sica de binÃ¡rios `su` em 9 diretÃ³rios do sistema Android (`/sbin/su`, `/system/bin/su`, `/data/local/xbin/su`, etc.) e executa `Runtime.getRuntime().exec("which su")`.
   - MÃ©todo `isEmulator()`: Inspeciona strings de hardware no `Build.FINGERPRINT`, `Build.MODEL`, `Build.MANUFACTURER` e `Build.DEVICE` procurando marcas como `generic`, `google_sdk`, `Genymotion`.
   - MÃ©todo `isDeveloperModeEnabled()`: Consulta `Settings.Global.DEVELOPMENT_SETTINGS_ENABLED`.
   - Se qualquer um desses checks falhar, o app notifica o backend via log de seguranÃ§a (`vulnerability_detected`) e pode restringir a execuÃ§Ã£o.

---

## 4. Diagrama de Fluxo de Dados e Camadas
```mermaid
graph TD
    UI[Interface do UsuÃ¡rio / Screens] -->|Dispara AÃ§Ã£o| Service[Services / UseCases]
    Service -->|Checa ConexÃ£o & Cache| LocalData[(SharedPreferences / SecureStorage)]
    Service -->|Chamadas de API & RPCs| SupabaseClient[Supabase Client]
    SupabaseClient -->|PostgREST / JSON| Postgres[(Supabase PostgreSQL)]
    Postgres -->|Trigger AutomÃ¡tico| Estoque[(Tabela estoque_atual)]
    
    Service -.->|Se Falhar Rede| Queue[(Fila de MovimentaÃ§Ãµes Offline)]
    Queue -.->|Timer de 30s| SupabaseClient
```

---

## 5. Requisitos para a VersÃ£o React Native
- Substituir o `Provider` por **Zustand** ou **Redux Toolkit**, garantindo store modular desacoplada da UI.
- Substituir `SharedPreferences` por **AsyncStorage** ou **MMKV** (alta performance).
- Substituir `FlutterSecureStorage` por **expo-secure-store** ou **react-native-keychain**.
- Reproduzir os canais de Ã¡udio e seguranÃ§a atravÃ©s de bibliotecas Expo (`expo-av`, `expo-device`, `expo-application`, `expo-haptics`) ou TurboModules equivalentes.