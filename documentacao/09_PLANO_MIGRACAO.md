# 09 â€” PLANO E ESTRATÃ‰GIA DE MIGRAÃ‡ÃƒO (REACT NATIVE)

## 1. Stack TecnolÃ³gica Alvo
- **Framework:** React Native 0.74+ com **Expo SDK 51+** (Prebuild / Config Plugins)
- **Linguagem:** TypeScript 5.x com tipagem estrita (`strict: true`)
- **EstilizaÃ§Ã£o:** Tailwind CSS via **NativeWind v4** ou StyleSheet padronizado
- **NavegaÃ§Ã£o:** **React Navigation 6+** (Native Stack Navigator)
- **Gerenciamento de Estado:** **Zustand** (leve, modular, sem boilerplate)
- **ValidaÃ§Ã£o de Schemas:** **Zod**
- **PersistÃªncia Segura:** `expo-secure-store`
- **PersistÃªncia de Cache e Fila:** `@react-native-async-storage/async-storage` ou `react-native-mmkv`
- **Leitor de CÃ³digo:** `expo-camera` (com leitor de cÃ³digo de barras embutido)
- **Ãudio e Haptics:** `expo-av` e `expo-haptics`
- **LocalizaÃ§Ã£o:** `expo-location`

---

## 2. Fases de ExecuÃ§Ã£o da MigraÃ§Ã£o

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚     FASE 1      â”‚     â”‚      FASE 2      â”‚     â”‚     FASE 3      â”‚
â”‚  Setup & Core   â”‚ â”€â”€> â”‚ AutenticaÃ§Ã£o/Seg â”‚ â”€â”€> â”‚  Offline & Sync â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                          â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â–¼
â”‚     FASE 6      â”‚     â”‚      FASE 5      â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ HomologaÃ§Ã£o/QA  â”‚ <â”€â”€ â”‚ 14 Telas da App  â”‚ <â”€â”€ â”‚ Hardware/Camera â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚     FASE 4      â”‚
                                                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Fase 1: Setup do RepositÃ³rio e Camada Core
1. InicializaÃ§Ã£o do projeto Expo TypeScript com path aliases (`@/core`, `@/features`, `@/services`, `@/components`).
2. ConfiguraÃ§Ã£o do cliente Supabase e carregamento de variÃ¡veis de ambiente.
3. CriaÃ§Ã£o dos Design Tokens (Cores idÃªnticas: Vermelho PrimÃ¡rio `#D32F2F`, Dark `#9A0007`, Light `#FF6659`, SuperfÃ­cies `#F5F5F5`).

### Fase 2: AutenticaÃ§Ã£o, Dispositivos e SeguranÃ§a
1. ImplementaÃ§Ã£o dos usecases de login (crachÃ¡ + PIN de 6 dÃ­gitos) e hash SHA-256 via `expo-crypto`.
2. ImplementaÃ§Ã£o da proteÃ§Ã£o anti-forÃ§a bruta com cronÃ´metro regressivo.
3. ImplementaÃ§Ã£o do Device Whitelisting e telas de dispositivo pendente/bloqueado.
4. MÃ³dulo de verificaÃ§Ã£o de seguranÃ§a (detecÃ§Ã£o de Root/Jailbreak/Emulador).

### Fase 3: Motor de Cache Local e Fila Offline
1. ConfiguraÃ§Ã£o do listener de conectividade `@react-native-community/netinfo`.
2. CriaÃ§Ã£o do `SyncEngine` com fila em AsyncStorage/MMKV e loop de sincronizaÃ§Ã£o automÃ¡tica a cada 30 segundos.
3. Cache local de apoio para produtos, funcionÃ¡rios e prateleiras.

### Fase 4: IntegraÃ§Ãµes de Hardware e Scanner
1. ImplementaÃ§Ã£o da tela de Scanner em tela cheia com overlay visual idÃªntico.
2. IntegraÃ§Ã£o do som de bipe de leitor industrial (`expo-av`) e vibraÃ§Ã£o (`expo-haptics`).
3. UtilitÃ¡rio de higienizaÃ§Ã£o de cÃ³digo via Regex para crachÃ¡s industriais.

### Fase 5: ImplementaÃ§Ã£o das 14 Telas Operacionais
1. Splash & Onboarding.
2. Home com monitor de inatividade de 30 minutos e cards em grid.
3. Entrada, SaÃ­da (com carrinho e modal de senha), DevoluÃ§Ã£o e Nada Consta.
4. InventÃ¡rio com reconciliaÃ§Ã£o fÃ­sica e transferÃªncia de prateleira.
5. LocalizaÃ§Ã£o bimodal e Estoque Baixo.

### Fase 6: HomologaÃ§Ã£o, Testes Automatizados e Build
1. Testes de integraÃ§Ã£o E2E com Detox ou Maestro.
2. HomologaÃ§Ã£o em dispositivos fÃ­sicos Android e iOS.
3. GeraÃ§Ã£o de builds de homologaÃ§Ã£o (APK/AAB e IPA via EAS Build).