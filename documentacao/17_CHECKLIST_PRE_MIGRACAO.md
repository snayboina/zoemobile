# 17 â€” CHECKLIST DE PRÃ‰-VOO PARA INÃCIO DA MIGRAÃ‡ÃƒO

Este checklist consolida todos os prÃ©-requisitos tÃ©cnicos, de governanÃ§a e de seguranÃ§a que devem estar validados antes que a primeira linha de cÃ³digo React Native seja escrita.

---

## 1. GovernanÃ§a e Regras InegociÃ¡veis
- [x] O projeto Flutter original em `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque` permanece 100% intocado.
- [x] Nenhuma alteraÃ§Ã£o estrutural foi executada no banco de dados Supabase de produÃ§Ã£o.
- [x] A pasta isolada `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque-ReactNative` foi criada exclusivamente para o novo projeto.
- [x] O arquivo `AGENTS.md` estÃ¡ ativo com as regras mandatÃ³rias para inteligÃªncias artificiais.
- [ ] **AprovaÃ§Ã£o explÃ­cita do gestor humano para inÃ­cio da codificaÃ§Ã£o React Native.**

---

## 2. DecisÃµes TÃ©cnicas Alinhadas
- [x] **AdoÃ§Ã£o do Expo Development Build:** Confirmada a obrigatoriedade do Prebuild / EAS Build em detrimento do Expo Go devido a mÃ³dulos nativos (Root check, ToneGenerator / Ãudio, MMKV).
- [x] **Arquitetura de Estado:** Definido **Zustand** para gerenciamento de stores leves e desacopladas.
- [x] **Tipagem:** TypeScript em modo estrito (`strict: true`) com schemas **Zod** para validaÃ§Ã£o em runtime.
- [ ] **DefiniÃ§Ã£o da ValidaÃ§Ã£o de Senha Offline:** Aguardando resposta do gestor sobre aprovaÃ§Ã£o provisÃ³ria vs cache seguro de hash local.

---

## 3. Roteiro Modular Proposto para a ProgramaÃ§Ã£o
A implementaÃ§Ã£o serÃ¡ dividida em mÃ³dulos atÃ´micos, testados incrementalmente:

1. **MÃ³dulo 1: FundaÃ§Ã£o & Core:** Setup Expo SDK 51+, TypeScript, Design Tokens (Cores idÃªnticas `#D32F2F`), Supabase Client e SecureStore.
2. **MÃ³dulo 2: AutenticaÃ§Ã£o & Hardware Security:** Login por crachÃ¡ + PIN 6D, detecÃ§Ã£o de Root/Emulador, proteÃ§Ã£o brute-force e tela de aparelho pendente.
3. **MÃ³dulo 3: Motor de Dados & Fila Offline:** Store Zustand de produtos e funcionÃ¡rios com fallback em cache e motor de fila offline a cada 30 segundos.
4. **MÃ³dulo 4: Scanner Industrial & Ãudio:** Tela de scanner com cÃ¢mera, mira visual, lanterna, som de bipe e higienizaÃ§Ã£o de cÃ³digo por Regex.
5. **MÃ³dulo 5: Telas Operacionais (MovimentaÃ§Ã£o):** SaÃ­da com carrinho, bloqueio de EPI e modal de senha 4D; Entrada; DevoluÃ§Ã£o com reordenaÃ§Ã£o de pendÃªncias; Nada Consta.
6. **MÃ³dulo 6: Telas de Estoque & ReconciliaÃ§Ã£o:** InventÃ¡rio com transferÃªncia fÃ­sica e ajuste; LocalizaÃ§Ã£o bimodal; Estoque Baixo; Home com monitor de inatividade.
7. **MÃ³dulo 7: HomologaÃ§Ã£o & Build Release:** Testes E2E, geraÃ§Ã£o de APK/AAB e validaÃ§Ã£o comparativa final com o Flutter.