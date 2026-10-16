# 06 â€” AUTENTICAÃ‡ÃƒO E PERMISSÃ•ES

## 1. Arquitetura de AutenticaÃ§Ã£o Customizada
Diferente de aplicaÃ§Ãµes convencionais que utilizam o mÃ³dulo GoTrue do Supabase (com e-mail e senha de usuÃ¡rio), o **ZOESTOCK** implementa uma arquitetura de autenticaÃ§Ã£o customizada em duas etapas:
1. **Operador do Terminal (Almoxarife):**
   - Autentica no aplicativo via CrachÃ¡ + PIN de 6 dÃ­gitos.
   - O PIN Ã© criptografado localmente em SHA-256 e transmitido para a RPC `validar_login_funcionario`.
   - O aplicativo atua perante o PostgREST utilizando a chave pÃºblica (`anonKey`). A seguranÃ§a operacional e o isolamento de tenant sÃ£o garantidos pela injeÃ§Ã£o mandatÃ³ria de `empresa_id` e pelas regras nas RPCs.
2. **BeneficiÃ¡rio da TransaÃ§Ã£o (Colaborador que retira/devolve):**
   - Identificado pelo CrachÃ¡ (digitado ou lido por QR Code na cÃ¢mera).
   - Autoriza cada transaÃ§Ã£o digitando um PIN de 4 dÃ­gitos na tela do almoxarife, validado pela RPC `validar_senha_movimentacao`.

---

## 2. Ciclo de Vida da SessÃ£o do UsuÃ¡rio
```mermaid
sequenceDiagram
    autonumber
    actor Operador as Almoxarife
    participant App as AppEstoque
    participant Storage as SecureStorage
    participant RPC as Supabase RPC (validar_login)
    participant DB as PostgreSQL

    Operador->>App: Digita CrachÃ¡ e PIN (6 dÃ­gitos)
    App->>App: Gera Hash SHA-256 do PIN
    App->>App: Coleta GPS, Device ID e Metadados
    App->>RPC: validar_login_funcionario(cracha, pinHash, device, gps)
    RPC->>DB: Verifica crachÃ¡, pin_hash e status do aparelho
    alt Aparelho NÃ£o Aprovado
        DB-->>RPC: {sucesso: false, erro: "dispositivo_pendente"}
        RPC-->>App: Redireciona para PendingDeviceScreen
    alt Credenciais InvÃ¡lidas
        DB-->>RPC: {sucesso: false, erro: "Credenciais invÃ¡lidas"}
        RPC-->>App: Incrementa contador de falhas (ativa proteÃ§Ã£o brute-force)
    else Sucesso
        DB-->>RPC: {sucesso: true, funcionario: {...}}
        RPC-->>App: SessÃ£o Aprovada
        App->>Storage: Salva SessÃ£o e Token Local
        App->>App: Inicia Monitor de Inatividade (30s)
        App->>Operador: Navega para a HomeScreen
    end
```

---

## 3. GestÃ£o e HomologaÃ§Ã£o de Dispositivos (Device Whitelisting)
O sistema exige que todo aparelho fÃ­sico seja registrado e homologado:
- O identificador Ãºnico `device_id` Ã© capturado nativamente (no Android via `Build.ID` / `Settings.Secure.ANDROID_ID`, no iOS via `identifierForVendor`).
- Se o dispositivo for novo, o backend cria um registro com status `PENDENTE` na tabela de dispositivos.
- O operador fica bloqueado na tela `PendingDeviceScreen` atÃ© que o gestor acesse o Painel Web e altere o status para `APROVADO`.
- Se um aparelho for roubado ou extraviado, o gestor marca como `BLOQUEADO` no Painel Web, e qualquer tentativa de acesso subsequente Ã© barrada imediatamente.

---

## 4. Biometria Local (`local_auth`)
- O aplicativo possui suporte Ã  biometria nativa (TouchID, FaceID, BiometricPrompt do Android).
- A flag `auth_biometrics_enabled` Ã© persistida no `FlutterSecureStorage`.
- Quando ativada, permite reabertura Ã¡gil do app sem necessidade de redigitar o PIN de 6 dÃ­gitos, mantendo a chave do crachÃ¡ memorizada no armazenamento seguro.