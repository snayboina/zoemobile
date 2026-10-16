# 00 â€” VISÃƒO GERAL DO SISTEMA

## 1. IdentificaÃ§Ã£o do Projeto
- **Nome Comercial:** ZOESTOCK / StockAngel Mobile
- **Identificador de Pacote Android:** `com.stockangel.stockangel_mobile`
- **Identificador de Pacote iOS:** `stockangel_mobile`
- **VersÃ£o Registrada:** `1.0.0+1`
- **SDK Dart/Flutter:** Dart ^3.12.2 / Flutter 3.x
- **BaaS e Banco de Dados:** Supabase (PostgreSQL 15+, PostgREST, RLS, RPCs, Storage)
- **DiretÃ³rio Original (Flutter):** `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque`
- **DiretÃ³rio de Destino (MigraÃ§Ã£o React Native):** `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque-ReactNative`

---

## 2. PropÃ³sito e Problema de NegÃ³cio
O **ZOESTOCK** Ã© um aplicativo mÃ³vel empresarial focado na gestÃ£o fÃ­sica, conferÃªncia, rastreabilidade e auditoria de estoque em tempo real para indÃºstrias, almoxarifados de obras e centros logÃ­sticos.

Ele resolve gargalos crÃ­ticos em operaÃ§Ãµes fÃ­sicas:
1. **Controle de Perdas e Desvios:** Vincula obrigatoriamente cada ferramenta, insumo ou EPI retirado ao crachÃ¡ e assinatura eletrÃ´nica do colaborador.
2. **Conformidade Legal de EPIs (Norma Regulamentadora NR-6):** Bloqueia automaticamente a entrega de equipamentos com Certificado de AprovaÃ§Ã£o (CA) ou prazo de calibraÃ§Ã£o/aferiÃ§Ã£o vencidos.
3. **Assinatura EletrÃ´nica no Ponto de Entrega:** Exige confirmaÃ§Ã£o por PIN de 4 dÃ­gitos do colaborador beneficiÃ¡rio, garantindo comprovaÃ§Ã£o de recebimento sem papelada.
4. **InventÃ¡rio Ãgil e ReconciliaÃ§Ã£o FÃ­sica:** Agiliza a contagem cega ou dirigida de produtos nas prateleiras, gerando lanÃ§amentos de ajuste automÃ¡tico para divergÃªncias identificadas.
5. **Continuidade Operacional sem ConexÃ£o (Offline-First):** Assegura que retiradas e devoluÃ§Ãµes continuem acontecendo mesmo em Ã¡reas sem sinal de internet ou subsolos, enfileirando as transaÃ§Ãµes com carimbo de data/hora original e disparando a sincronizaÃ§Ã£o quando a rede volta.
6. **Auditoria Forense Automatizada:** Cada movimentaÃ§Ã£o registra coordenadas geogrÃ¡ficas (GPS), identificador de hardware (Device ID), matrÃ­cula do almoxarife operador, versÃ£o do app e endereÃ§o de rede.

---

## 3. Matriz de Perfis e Atores
| Ator / Perfil | Papel no Sistema | MÃ©todo de Acesso | Limites Operacionais |
| :--- | :--- | :--- | :--- |
| **Almoxarife / Estoquista** | Operador fÃ­sico do aplicativo mÃ³vel. LanÃ§a entradas, saÃ­das, devoluÃ§Ãµes e inventÃ¡rios. | CrachÃ¡ + PIN de 6 dÃ­gitos no aplicativo | Limitado Ã  sua empresa (`empresa_id`). Acesso bloqueado se o dispositivo fÃ­sico nÃ£o for homologado. |
| **Colaborador / OperÃ¡rio** | BeneficiÃ¡rio que requisita ou devolve materiais. NÃ£o opera o sistema. | CrachÃ¡ (lido via QR Code ou busca) + Senha de 4 dÃ­gitos | NÃ£o possui login no app. Assina transaÃ§Ãµes digitando sua senha de movimentaÃ§Ã£o na tela do almoxarife. |
| **Gestor / Dono da Empresa** | Administrador do tenant. Gerencia produtos, fornecedores e aprova aparelhos. | Painel Web ZoeStock (Desktop/Navegador) | Acesso irrestrito aos dados da empresa no ambiente Web. |
| **Auditor de SeguranÃ§a / SST** | Fiscaliza entregas de EPIs e emite termos de Nada Consta de colaboradores. | Aplicativo (Tela Nada Consta) e Painel Web | Consulta de pendÃªncias e histÃ³rico fiscal. |

---

## 4. Ecossistema Integrado ZoeStock
```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   PAINEL WEB GESTOR                    â”‚
â”‚        (React 18, TypeScript, Tailwind, Vite)          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚ PostgREST / RPCs
                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   SUPABASE POSTGRESQL                  â”‚
â”‚       (Multi-tenant, RLS, Triggers, Views, RPCs)       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–²â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚ PostgREST / RPCs (Role: anon / auth)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              ZOESTOCK MOBILE (AppEstoque)              â”‚
â”‚            OperaÃ§Ã£o de Campo & Almoxarifado            â”‚
â”‚  - Scanner de CÃ³digos de Barra e QR Code com Bip       â”‚
â”‚  - Assinatura EletrÃ´nica por Senha (4 dÃ­gitos)         â”‚
â”‚  - Fila Offline e SincronizaÃ§Ã£o em Segundo Plano       â”‚
â”‚  - Auditoria de GPS, Device ID e DetecÃ§Ã£o de Root      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 5. Diretrizes da MigraÃ§Ã£o para React Native
A futura migraÃ§Ã£o do AppEstoque para React Native deverÃ¡ observar rigorosamente:
- Manter paridade funcional de 100% com as 14 telas existentes.
- Preservar todas as regras de negÃ³cio (`RN-001` a `RN-025`) e bloqueios de seguranÃ§a sem simplificaÃ§Ãµes.
- Adotar TypeScript com tipagem estrita e schema validation (Zod).
- Utilizar Expo SDK 51+ com arquitetura modular, persistÃªncia segura (`expo-secure-store`) e scanner nativo (`expo-camera` / `react-native-vision-camera`).
- Garantir compatibilidade transparente com os contratos de API e banco de dados Supabase em produÃ§Ã£o.