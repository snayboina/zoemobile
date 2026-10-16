# 11 â€” CRITÃ‰RIOS DE TESTES E ACEITE

Para que qualquer mÃ³dulo da futura versÃ£o React Native seja considerado aprovado, ele deverÃ¡ passar obrigatoriamente pelos seguintes casos de teste:

---

## 1. Casos de Teste de SeguranÃ§a (SecTest)
- **CT-SEC-01 (Bloqueio ForÃ§a Bruta):** Digitar o PIN do almoxarife incorretamente 3 vezes consecutivas.
  - *CritÃ©rio de Aceite:* O app deve travar os botÃµes e iniciar um cronÃ´metro regressivo visÃ­vel de 30 a 60 segundos.
- **CT-SEC-02 (Aparelho NÃ£o Autorizado):** Instalar o app em um celular novo e tentar login.
  - *CritÃ©rio de Aceite:* O app deve barrar a entrada e direcionar para `PendingDeviceScreen`, exibindo o Device ID exato para autorizaÃ§Ã£o.
- **CT-SEC-03 (Bloqueio de EPI Vencido):** Selecionar um EPI cujo Certificado de AprovaÃ§Ã£o (CA) ou calibraÃ§Ã£o periÃ³dica esteja com data passada e `bloquear_vencido = true`.
  - *CritÃ©rio de Aceite:* O app deve exibir o modal de alerta vermelho e impedir estritamente a inclusÃ£o do item no carrinho de saÃ­da.
- **CT-SEC-04 (Assinatura por Senha Errada):** No fechamento da saÃ­da ou devoluÃ§Ã£o, digitar senha incorreta no modal de 4 dÃ­gitos.
  - *CritÃ©rio de Aceite:* A transaÃ§Ã£o deve ser recusada e nenhuma movimentaÃ§Ã£o pode ser inserida no banco de dados.

---

## 2. Casos de Teste Operacionais e de NegÃ³cio (OpTest)
- **CT-OP-01 (ConsistÃªncia de Saldo):** Produto com estoque 10. Realizar saÃ­da de 4 unidades.
  - *CritÃ©rio de Aceite:* A tabela `movimentacoes` registra tipo `SA` de 4 unidades e a tabela `estoque_atual` passa a exibir imediatamente saldo 6.
- **CT-OP-02 (Nada Consta Positivo e Negativo):**
  - Colaborador que retirou e nÃ£o devolveu -> Tela exibe alerta vermelho e lista a quantidade devida.
  - Colaborador que devolveu tudo -> Tela exibe selo verde "NADA CONSTA - Colaborador nÃ£o possui pendÃªncias".
- **CT-OP-03 (InventÃ¡rio com Troca de Prateleira):** Produto localizado na Prateleira A com saldo 5. Informar contagem fÃ­sica de 4 unidades e selecionar Prateleira B.
  - *CritÃ©rio de Aceite:* Gera saÃ­da de 5 na Prateleira A (zerando o local) e entrada de 4 na Prateleira B.
- **CT-OP-04 (HigienizaÃ§Ã£o de CÃ³digo no Scanner):** Ler um cÃ³digo de barras de crachÃ¡ contendo `"COLAB-98765-SP"`.
  - *CritÃ©rio de Aceite:* O campo deve receber unicamente `"98765"` e encontrar o colaborador automaticamente.

---

## 3. Casos de Teste de ResiliÃªncia e Offline (NetTest)
- **CT-NET-01 (SaÃ­da sem ConexÃ£o):** Ativar Modo AviÃ£o no celular. Registrar uma saÃ­da de produto e confirmar com senha.
  - *CritÃ©rio de Aceite:* O app deve notificar que a transaÃ§Ã£o foi salva offline, adicionar o registro Ã  fila local e voltar Ã  Home sem travar. O banner da Home passa a indicar "1 SincronizaÃ§Ã£o Pendente".
- **CT-NET-02 (SincronizaÃ§Ã£o AutomÃ¡tica em Background):** Com itens na fila offline, desativar o Modo AviÃ£o.
  - *CritÃ©rio de Aceite:* Em atÃ© 30 segundos, o timer de background deve transmitir as movimentaÃ§Ãµes para o Supabase, limpar a fila local e zerar o banner de advertÃªncia da Home.