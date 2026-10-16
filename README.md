# ZOESTOCK MOBILE â€” REPOSITÃ“RIO REACT NATIVE

Este diretÃ³rio Ã© o destino exclusivo da futura migraÃ§Ã£o do aplicativo mÃ³vel **ZOESTOCK / StockAngel Mobile** de Flutter/Dart para **React Native (Expo SDK 51+ com TypeScript)**.

---

## 1. LocalizaÃ§Ã£o do Projeto Original (Flutter)
- O cÃ³digo-fonte Flutter de referÃªncia permanece intacto em:
  `c:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque`

---

## 2. Acervo de DocumentaÃ§Ã£o TÃ©cnica Completa (18 Documentos)
```text
AppEstoque-ReactNative/
â”œâ”€â”€ documentacao/           # Engenharia Reversa, Auditoria e EspecificaÃ§Ãµes
â”‚   â”œâ”€â”€ 00_VISAO_GERAL.md
â”‚   â”œâ”€â”€ 01_ARQUITETURA_ATUAL.md
â”‚   â”œâ”€â”€ 02_TELAS_E_NAVEGACAO.md
â”‚   â”œâ”€â”€ 03_REGRAS_DE_NEGOCIO.md
â”‚   â”œâ”€â”€ 04_BLOQUEIOS_E_SEGURANCA.md
â”‚   â”œâ”€â”€ 05_SUPABASE_E_BANCO.md
â”‚   â”œâ”€â”€ 06_AUTENTICACAO_E_PERMISSOES.md
â”‚   â”œâ”€â”€ 07_DEPENDENCIAS_E_SERVICOS.md
â”‚   â”œâ”€â”€ 08_MODELOS_E_FLUXOS.md
â”‚   â”œâ”€â”€ 09_PLANO_MIGRACAO.md
â”‚   â”œâ”€â”€ 10_MATRIZ_RASTREABILIDADE.md
â”‚   â”œâ”€â”€ 11_TESTES_E_ACEITE.md
â”‚   â”œâ”€â”€ 12_RISCOS_E_PENDENCIAS.md
â”‚   â”œâ”€â”€ 13_VALIDACAO_DA_AUDITORIA.md         # [FASE 2] ComprovaÃ§Ã£o de evidÃªncias
â”‚   â”œâ”€â”€ 14_PLANO_DE_SEGURANCA_BACKEND.md     # [FASE 2] Blindagem de EPI e concorrÃªncia
â”‚   â”œâ”€â”€ 15_COMPATIBILIDADE_NATIVA.md         # [FASE 2] AnÃ¡lise Expo Dev Build vs Go
â”‚   â”œâ”€â”€ 16_TESTES_DE_REGRESSAO.md            # [FASE 2] Casos positivos e negativos
â”‚   â””â”€â”€ 17_CHECKLIST_PRE_MIGRACAO.md         # [FASE 2] Checklist de prÃ©-voo
â”‚
â”œâ”€â”€ src/                    # CÃ³digo-fonte React Native (Aguardando autorizaÃ§Ã£o)
â”‚   â””â”€â”€ README.md
â”‚
â”œâ”€â”€ README.md               # Este guia geral
â””â”€â”€ AGENTS.md               # Diretrizes mandatÃ³rias para Agentes de IA
```

---

## 3. Como Consultar as EspecificaÃ§Ãµes
- **Para entender as 14 Telas:** Consulte [02_TELAS_E_NAVEGACAO.md](documentacao/02_TELAS_E_NAVEGACAO.md).
- **Para consultar as 25 Regras de NegÃ³cio:** Consulte [03_REGRAS_DE_NEGOCIO.md](documentacao/03_REGRAS_DE_NEGOCIO.md) e [13_VALIDACAO_DA_AUDITORIA.md](documentacao/13_VALIDACAO_DA_AUDITORIA.md).
- **Para bloqueios de seguranÃ§a e conformidade:** Consulte [04_BLOQUEIOS_E_SEGURANCA.md](documentacao/04_BLOQUEIOS_E_SEGURANCA.md) e [14_PLANO_DE_SEGURANCA_BACKEND.md](documentacao/14_PLANO_DE_SEGURANCA_BACKEND.md).
- **Para compatibilidade nativa (Expo Dev Build):** Consulte [15_COMPATIBILIDADE_NATIVA.md](documentacao/15_COMPATIBILIDADE_NATIVA.md).
- **Para a esteira de testes de equivalÃªncia:** Consulte [16_TESTES_DE_REGRESSAO.md](documentacao/16_TESTES_DE_REGRESSAO.md).
- **Para o checklist de prÃ©-voo:** Consulte [17_CHECKLIST_PRE_MIGRACAO.md](documentacao/17_CHECKLIST_PRE_MIGRACAO.md).

---

## 4. Regras Absolutas e PadrÃµes Arquiteturais
1. **NÃƒO alterar o projeto Flutter original.**
2. **NÃƒO modificar tabelas, permissÃµes ou dados do Supabase de produÃ§Ã£o.**
3. **NÃƒO iniciar o desenvolvimento do React Native sem autorizaÃ§Ã£o explÃ­cita do usuÃ¡rio.**
4. Todas as regras de negÃ³cio e validaÃ§Ãµes de seguranÃ§a do Flutter original devem ser preservadas com 100% de fidelidade.
5. Manter a Matriz de Rastreabilidade atualizada a cada mÃ³dulo entregue.