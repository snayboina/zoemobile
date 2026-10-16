# 12 â€” MATRIZ DE RISCOS E PENDÃŠNCIAS

## 1. Matriz de Riscos TÃ©cnicos e MitigaÃ§Ãµes

| # | DescriÃ§Ã£o do Risco | Gravidade | Probabilidade | EstratÃ©gia de MitigaÃ§Ã£o |
| :-: | :--- | :---: | :---: | :--- |
| **R-01** | **Conflitos de PolÃ­ticas RLS no Supabase:** Scripts de blindagem no PostgreSQL podem bloquear requisiÃ§Ãµes da role `anon` do app mÃ³vel. | Alta | Alta | Manter rigorosamente aplicadas as permissÃµes de API concedidas no Script 123 (`GRANT SELECT, INSERT ON ... TO anon, authenticated`). |
| **R-02** | **DivergÃªncia de UUID de Aparelho MÃ³vel:** Em dispositivos Android, o ID pode mudar apÃ³s reset de fÃ¡brica ou troca de ROM. | MÃ©dia | MÃ©dia | Utilizar identificador estÃ¡vel derivado de hardware (`expo-application.getAndroidId()` ou `identifierForVendor` no iOS). |
| **R-03** | **Perda da Fila Offline em DesinstalaÃ§Ã£o:** Se o almoxarife desinstalar o app antes da sincronizaÃ§Ã£o, a fila em AsyncStorage serÃ¡ perdida. | Alta | Baixa | Alerta na tela informando que hÃ¡ pendÃªncias nÃ£o sincronizadas e bloquear o logout manual enquanto houver itens na fila. |
| **R-04** | **LatÃªncia de CÃ¢mera e Scanner:** CÃ¢meras lentas em aparelhos de baixo custo podem prejudicar a velocidade no almoxarifado. | MÃ©dia | Alta | Utilizar resoluÃ§Ã£o balanceada (720p) e configurar `DetectionSpeed.normal` para otimizar processamento por frame. |
| **R-05** | **Furo de Estoque em TransaÃ§Ãµes Concorrentes:** Dois almoxarifes retirando o mesmo item simultaneamente sem sinal de internet. | Alta | Baixa | O Supabase deve incorporar constraint `CHECK (quantidade >= 0)` em `estoque_atual` para que a sincronizaÃ§Ã£o posterior rejeite inconsistÃªncias. |

---

## 2. Itens Pendentes de ValidaÃ§Ã£o Humana
1. **PolÃ­tica de ValidaÃ§Ã£o de Senha Offline:**
   - No Flutter (`funcionario_service.dart:82-88`), se o dispositivo estiver offline durante a confirmaÃ§Ã£o de senha do operÃ¡rio, o sistema libera a operaÃ§Ã£o com aviso: *"Modo offline: ValidaÃ§Ã£o de senha adiada"*.
   - *Pergunta para o Gestor:* Devemos manter essa liberaÃ§Ã£o emergencial offline ou a senha deve ser validada contra um hash local armazenado em cache no aparelho?
2. **Tempo Limite de Inatividade da SessÃ£o:**
   - O temporizador atual realiza check a cada 30 segundos e encerra em 30 minutos.
   - *Pergunta para o Gestor:* Esse tempo de 30 minutos atende Ã  rotina dos almoxarifados ou deve ser parametrizÃ¡vel por empresa?
3. **Som de Bipe do Scanner:**
   - No Android original, Ã© utilizado o `ToneGenerator` nativo do sistema.
   - *Pergunta para o Gestor:* Um arquivo de Ã¡udio WAV puro com som idÃªntico de leitor laser atende no React Native ou prefere mÃ³dulo nativo puro Kotlin/Swift?