# GUIA E DIRETRIZES PARA AGENTES DE IA (AGENTS.md)

Este documento define regras de conduta tÃ©cnica e operacional obrigatÃ³rias para qualquer Agente de InteligÃªncia Artificial que atuar neste repositÃ³rio.

---

## 1. PrincÃ­pios Fundamentais
1. **Consulta PrÃ©via ObrigatÃ³ria:** Antes de propor ou implementar qualquer funcionalidade em React Native, leia obrigatoriamente a especificaÃ§Ã£o correspondente na pasta `documentacao/` (especialmente `13_VALIDACAO_DA_AUDITORIA.md`, `14_PLANO_DE_SEGURANCA_BACKEND.md`, `15_COMPATIBILIDADE_NATIVA.md` e `16_TESTES_DE_REGRESSAO.md`).
2. **Preservação de Regras e Bloqueios:** É terminantemente proibido simplificar, burlar ou ignorar validações de negócio (ex: bloqueio de EPI vencido, exigência de PIN de 6 dígitos, validação de saldo no carrinho, detecção de Root).
3. **NÃ£o Alterar o Supabase de ProduÃ§Ã£o:** Nenhuma alteraÃ§Ã£o estrutural em tabelas, triggers ou RLS deve ser executada sem instruÃ§Ã£o e autorizaÃ§Ã£o formal do usuÃ¡rio.
4. **NÃ£o Modificar o Projeto Flutter Original:** O diretÃ³rio `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque` Ã© exclusivamente para leitura e referÃªncia histÃ³rica.
5. **Rastreabilidade ContÃ­nua:** Sempre que uma funcionalidade for implementada e homologada, o agente deve atualizar o status correspondente no arquivo `documentacao/10_MATRIZ_RASTREABILIDADE.md`.
6. **CompilaÃ§Ã£o Nativa (Expo Dev Build):** NÃ£o tentar rodar o app no Expo Go padrÃ£o; utilizar sempre o fluxo de Development Build conforme documentado em `15_COMPATIBILIDADE_NATIVA.md`.

---

## 2. PadrÃµes de CÃ³digo para a Futura MigraÃ§Ã£o React Native
- Usar **TypeScript estrito** sem permissÃ£o de `any` explÃ­cito nos modelos de dados.
- Componentes funcionais com Hooks (`React.FC`).
- Estados globais via **Zustand** divididos por domÃ­nios (`useAuthStore`, `useEstoqueStore`, `useSyncStore`).
- Tratamento de erro resiliente com blocos `try/catch` e desacoplamento para a fila offline.
- Manter o idioma PortuguÃªs do Brasil em todas as mensagens da interface do usuÃ¡rio.