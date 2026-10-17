# 13. MATRIZ DE MIGRAÇÃO DE ARQUIVOS E FUNCIONALIDADES

Este documento registra a equivalência estrutural, o status de migração e a rastreabilidade direta entre o projeto original Flutter (`AppEstoque`) e o novo projeto React Native (`AppEstoque-ReactNative`).

Data de Atualização: 16 de Outubro de 2026  
Status Atual do Projeto: **FASE 5 CONCLUÍDA COM ÊXITO** (Operações de Estoque 100% Migradas e Integradas ao Supabase com Design Lock Oficial) (Autenticação, Onboarding, Dispositivo Pendente e Navegação 100% Homologados)

---

## 1. Matriz Geral de Arquivos e Módulos

| Arquivo ou Funcionalidade | Origem Flutter | Destino React Native | Situação | Ação Necessária |
|---|---|---|---|---|
| **Ícone da Aplicação** | `assets/icon.png` | `assets/icon.png` | **MIGRADO** | Preservado em alta definição |
| **Imagens de Onboarding (30 fotos)** | `assets/onboarding/*` | `assets/onboarding/*` | **MIGRADO** | 30 arquivos de imagens transferidos integralmente |
| **Modelo de Produto & EPI** | `lib/models/produto_model.dart` | `src/types/models.ts` (`ProdutoModel`) | **MIGRADO** | Regras de negócio de CA, vencimento e serialização convertidas |
| **Modelo de Funcionário** | `lib/models/funcionario_model.dart` | `src/types/models.ts` (`FuncionarioModel`) | **MIGRADO** | Isolamento multiempresa e mapeamento de crachá e PIN |
| **Modelo de Movimentação** | `lib/models/movimentacao_model.dart` | `src/types/models.ts` (`MovimentacaoModel`) | **MIGRADO** | Tipos EN, SA, DV, auditoria de IP, GPS e device |
| **Modelo de Inventário** | `lib/models/inventario_model.dart` | `src/types/models.ts` (`InventarioModel`) | **MIGRADO** | Quantidade sistema vs real e divergências |
| **Modelo de Prateleira** | `lib/models/prateleira_model.dart` | `src/types/models.ts` (`PrateleiraModel`) | **MIGRADO** | Endereçamento logístico e zonas de armazém |
| **Modelo de Usuário Almoxarife** | `lib/models/usuario_model.dart` | `src/types/models.ts` (`UsuarioModel`) | **MIGRADO** | Perfis de acesso administrativo e operadores |
| **Modelo de Dispositivo & Telemetria**| `lib/features/auth/data/models/device_model.dart` | `src/types/models.ts` (`DeviceModel`) | **MIGRADO** | Identificação única de hardware, SO e aprovação |
| **Modelo de Sessão do Colaborador** | `lib/features/auth/domain/entities/session_info.dart` | `src/types/models.ts` (`SessionInfo`) | **MIGRADO** | Troca forçada de PIN e dados de empresa |
| **Modelo de Resultado Auth** | `lib/features/auth/data/models/auth_result_model.dart` | `src/types/models.ts` (`AuthResultModel`) | **MIGRADO** | Bloqueio por tentativas excedidas e retorno da RPC |
| **Modelo do Carrossel Onboarding** | `lib/features/onboarding/data/onboarding_data.dart` | `src/types/models.ts` (`OnboardingModel`) | **MIGRADO** | Tipagem do tutorial de apresentação |
| **Serviço de Produto** | `lib/services/produto_service.dart` | `src/services/produtoService.ts` | **MIGRADO** | Consultas, estoque baixo, agregação e cache offline implementados |
| **Serviço de Movimentações** | `lib/services/movimentacao_service.dart` | `src/services/movimentacaoService.ts` | **MIGRADO** | EN/SA/DV/CONSUMO, auditoria, trava de EPI vencido e cálculo de pendências |
| **Fila Offline de Contingência** | `lib/services/sync_service.dart` | `src/services/offline/syncService.ts` | **MIGRADO** | Sincronizador persistente particionado por tenant com retentativa periódica |
| **Serviço de Inventário** | `lib/services/inventario_service.dart` | `src/services/inventarioService.ts` | **MIGRADO** | Criação de cabeçalho e itens de contagem física |
| **Serviço de Prateleiras** | `lib/services/prateleira_service.dart` | `src/services/prateleiraService.ts` | **MIGRADO** | Endereçamento logístico com fallback para cache |
| **Serviço de Funcionários** | `lib/services/funcionario_service.dart` | `src/services/funcionarioService.ts` | **MIGRADO** | Consulta por crachá, hash SHA-256 e validação de PIN via RPC |
| **Serviço de Autenticação Real** | `lib/services/auth_service.dart` | `src/services/supabase/authService.ts` | **MIGRADO** | Contrato integral da RPC validar_login_funcionario com telemetria |
| **Design System & Temas** | `lib/core/app_theme.dart`, `app_colors.dart` | `src/theme/colors.ts`, `theme.ts` | **MIGRADO** | Paleta Dark Industrial adaptada para React Native |
| **Componentes Industriais Base** | `lib/widgets/stock_*.dart` | `src/components/common/*` | **PARCIAL** | AppButton, AppCard, AppInput criados; converter PinKeyboard e QuantitySelector |
| **Tela Splash** | `lib/screens/splash/splash_screen.dart` | `src/screens/auth/SplashScreen.tsx` | **MIGRADO** | Verificação de sessão, onboarding, device e roteamento dinâmico |
| **Tela Onboarding** | `lib/features/onboarding/presentation/screens/onboarding_screen.dart` | `src/screens/auth/OnboardingScreen.tsx` | **MIGRADO** | Carrossel de 4 etapas industriais com fotos migradas e persistência |
| **Tela Login (Crachá + PIN)** | `lib/screens/auth/login_screen.dart` | `src/screens/auth/LoginScreen.tsx` | **MIGRADO** | Crachá, teclado PIN virtual, força bruta, zero logs e isolamento |
| **Tela Dispositivo Pendente** | `lib/features/auth/presentation/screens/pending_device_screen.dart` | `src/screens/auth/PendingDeviceScreen.tsx` | **MIGRADO** | Metadados do aparelho, trava operacional e rechecagem de autorização |
| **Tela Home / Dashboard** | `lib/screens/home/home_screen.dart` | `src/screens/home/HomeScreen.tsx` | **MIGRADO** | Preservado padrão visual institucional (cabeçalho vermelho e 8 cards) |
| **Tela Entrada de Estoque** | `lib/screens/movimentacao/entrada_screen.dart` | `src/screens/operations/EntradaScreen.tsx` | **MIGRADO** | Busca de produto, quantidade, observação e confirmação transacional |
| **Tela Saída de Estoque** | `lib/screens/movimentacao/saida_screen.dart` | `src/screens/operations/SaidaScreen.tsx` | **MIGRADO** | Carrinho de saída, trava RN-08 (CA vencido/bloqueado) e senha PIN de 4 dígitos |
| **Tela Devolução de Estoque** | `lib/screens/movimentacao/devolucao_screen.dart` | `src/screens/operations/DevolucaoScreen.tsx` | **MIGRADO** | Consulta de pendências líquidas, devolução e confirmação com PIN |
| **Tela Histórico de Movimentações** | `lib/screens/movimentacao/movimentacoes_screen.dart` | `src/screens/operations/MovimentacoesScreen.tsx` | **MIGRADO** | Histórico filtrável (TODOS, EN, SA, DV) com data/hora em pt-BR |
| **Tela Nada Consta / Certidão** | `lib/screens/movimentacao/nada_consta_screen.dart` | `src/screens/operations/NadaConstaScreen.tsx` | **MIGRADO** | Verificação de pendências no Supabase e bloqueio estrito em modo offline |
| **Tela Inventário Físico** | `lib/screens/inventario/inventario_screen.dart` | `src/screens/operations/InventarioScreen.tsx` | **MIGRADO** | Contagem física, cálculo de divergência e ajuste transacional |
| **Tela Localização / Prateleiras** | `lib/screens/localizacao/localizacao_screen.dart` | `src/screens/operations/LocalizacaoScreen.tsx` | **MIGRADO** | Busca por produto e consulta de prateleiras/zonas |
| **Tela Alerta de Estoque Baixo** | `lib/screens/estoque/estoque_baixo_screen.dart` | `src/screens/estoque/EstoqueBaixoScreen.tsx` | **AUSENTE** | Converter na Fase 6 |
| **Tela Scanner Câmera (Barcode/QR)**| `lib/screens/scanner/scanner_screen.dart` | `src/screens/operations/ScannerScreen.tsx` | **MIGRADO** | Mira vermelha industrial, suporte a leitores ópticos e digitação manual |

---

## 2. Arquivos do Flutter Considerados NÃO APLICÁVEIS

Os seguintes diretórios e arquivos da origem **não** são transferidos para manter o repositório destino limpo e aderente às boas práticas do React Native:

- `build/`: Compilados intermediários de Android e Gradle do Flutter.
- `.dart_tool/`: Metadados locais do compilador Dart.
- `.flutter-plugins-dependencies` e `.packages`: Resolução interna do SDK Flutter.
- `pubspec.lock`: Substituído por `package-lock.json`.
- `.idea/`: Configurações de workspace do Android Studio.
- `.env`: Arquivo com credenciais de produção (bloqueado por regra de segurança; substituído por `.env.example`).

---

## 3. Registro de Validação Técnica da Fase 1

- **Ponto de Recuperação Git:** Criado no branch local `feature/fase-1-assets-modelos` a partir do commit base `a0fd8ad`.
- **Compilação TypeScript:** `tsc --noEmit` aprovado com 0 erros (`strict: true`).
- **Análise Estática ESLint:** `eslint .` aprovado com 0 problemas e 0 avisos (proibição rigorosa de `any` cumprida).
- **Testes Unitários Jest:** 3 suítes executadas, 25 testes aprovados com 100% de sucesso (`models.test.ts`, `validators.test.ts`, `formatters.test.ts`).

### Componentes Visuais Industriais e UI (Fase 3 — Homologada)

| Arquivo Flutter Original | Arquivo React Native Destino | Status | Observações Técnicas |
|---|---|---|---|
| `lib/core/app_colors.dart` | `src/theme/colors.ts` | Concluído | Identidade ZOESTOCK (Preto Profundo, Vermelho #D32F2F, Branco). |
| `lib/features/auth/presentation/widgets/pin_keyboard.dart` | `src/components/common/PinKeyboard.tsx` | Concluído | Teclado numérico 3x4, PIN dots, zero log, haptics e anti-duplicidade. |
| `lib/widgets/quantity_selector.dart` | `src/components/common/QuantitySelector.tsx` | Concluído | Stepper tátil 52px, entrada manual validada, teto de estoque e unidades. |
| `lib/screens/scanner/scanner_screen.dart` | `src/components/common/BarcodeScannerModal.tsx` | Concluído | CameraView Expo 52, mira vermelha industrial, lanterna e entrada manual. |
| `lib/widgets/alert_estoque_baixo.dart` | `src/components/common/EstoqueBaixoAlert.tsx` | Concluído | Sinalização de esgotado/baixo, modo sumário e modo individual. |
| *(Regras de EPI)* | `src/components/common/EpiConformidadeBadge.tsx` | Concluído | Badges de CA com trava estrita em situações desconhecidas. |
| `lib/widgets/stock_button.dart` | `src/components/common/AppButton.tsx` | Concluído | Botão industrial com variantes, loading e acessibilidade. |
| `lib/widgets/stock_card.dart` | `src/components/common/AppCard.tsx` | Concluído | Card operacional elevado com bordas industriais. |
| `lib/widgets/stock_input.dart` | `src/components/common/AppInput.tsx` | Concluído | Campo com foco no vermelho institucional e suporte a ícones. |
| *(Novo Componente)* | `src/components/common/ConfirmationModal.tsx` | Concluído | Modal de confirmação operacional de alto contraste. |
| *(Novo Componente)* | `src/components/common/EmptyState.tsx` | Concluído | Estado vazio com ilustrações e ação secundária. |
| *(Novo Componente)* | `src/components/common/ConnectionStatusIndicator.tsx` | Concluído | Pílula visual de conectividade, offline e contagem de fila. |
| *(Novo Teste)* | `src/__tests__/components.test.tsx` | Concluído | 21 testes automatizados cobrindo todos os requisitos visuais e táteis. |


### Telas de Autenticação e Navegação (Fase 4 — Homologada)

| Arquivo Flutter Original | Arquivo React Native Destino | Status | Observações Técnicas |
|---|---|---|---|
| `lib/screens/splash/splash_screen.dart` | `src/screens/auth/SplashScreen.tsx` | Concluído | Verificação de sessão existente, integridade de dispositivo e primeiro acesso. |
| `lib/features/onboarding/presentation/screens/onboarding_screen.dart` | `src/screens/auth/OnboardingScreen.tsx` | Concluído | Carrossel de 4 etapas, persistência de primeiro acesso e navegação segura. |
| `lib/screens/auth/login_screen.dart` | `src/screens/auth/LoginScreen.tsx` | Concluído | Autenticação por crachá e PIN de 4 dígitos via teclado industrial, proteção contra força bruta. |
| `lib/features/auth/presentation/screens/pending_device_screen.dart` | `src/screens/auth/PendingDeviceScreen.tsx` | Concluído | Bloqueio de hardware não credenciado, metadados do aparelho e revalidação. |
| *(Diagnóstico de Staging)* | `src/screens/diagnostic/EnvironmentDiagnosticScreen.tsx` | Concluído | Tela temporária declarada explicitamente como staging com logout seguro. |
| *(Navegação Centralizada)* | `src/navigation/RootNavigator.tsx` | Concluído | StackNavigator centralizado com tema dark e proteção de rotas. |
| *(Gerenciamento de Sessão)* | `src/store/useAuthStore.ts` | Concluído | Zustand store com persistência de sessão, multiempresa e injeção de dependência. |
| *(Tipos de Navegação)* | `src/types/navigation.ts` | Concluído | ParamList tipada para todas as rotas da aplicação. |
| *(Suíte de Testes)* | `src/__tests__/auth_navigation.test.tsx` | Concluído | 14 testes automatizados cobrindo todos os fluxos e cenários de exceção. |
