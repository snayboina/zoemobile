# 📱 GUIA DE EXECUÇÃO E INSTALAÇÃO — ZOESTOCK PWA

Este documento explica como executar e instalar o **ZOESTOCK PWA (Progressive Web App)** diretamente no Google Chrome ou no celular (Android / iOS).

---

## 🚀 1. Como Iniciar o Servidor de Desenvolvimento

Abra o terminal na pasta:
```powershell
cd "C:\arquivo backup pc\SISTEMAS FRANCIS\AppEstoque-PWA"
npm run dev
```

O Vite iniciará o servidor localmente em:
👉 **`http://localhost:5173`**

---

## 📲 2. Como Baixar e Instalar no Celular

### Opção A — No Computador (Google Chrome / Edge)
1. Abra `http://localhost:5173` no Google Chrome.
2. No topo da tela, aparecerá a barra vermelha do ZOESTOCK com o botão:  
   **[ 📱 Instalar Aplicativo ]**
3. Clique no botão. O Chrome exibirá a caixa nativa: **"Instalar aplicativo ZOESTOCK?"**.
4. Clique em **Instalar**.
5. Um ícone do ZOESTOCK será criado na sua Área de Trabalho e o app abrirá em janela própria independente (sem barra de URL do navegador).

---

### Opção B — No Celular Android (Google Chrome)
1. Certifique-se de que o computador e o celular estão conectados na **mesma rede Wi-Fi**.
2. Inicie o servidor liberando o IP da rede local:
   ```powershell
   npm run dev -- --host
   ```
3. No terminal aparecerá o endereço de rede (ex: `http://192.168.1.X:5173`).
4. Abra esse endereço no **Google Chrome** do celular.
5. O banner **"Instale o ZOESTOCK no Celular"** aparecerá automaticamente no topo.
6. Toque em **[ Instalar Aplicativo ]**.
7. O Chrome adicionará o aplicativo direto na tela inicial do celular com o ícone oficial do ZOESTOCK!

---

### Opção C — No iPhone / iPad (Safari)
1. Abra o endereço no navegador **Safari**.
2. Toque no botão **Compartilhar** (ícone do quadrado com a seta para cima na barra inferior).
3. Role as opções e selecione **"Adicionar à Tela de Início"**.
4. Toque em **Adicionar**.
5. O aplicativo funcionará em tela cheia como se fosse um app nativo da App Store.

---

## ⚙️ 3. Recursos Implementados na Fase 4 (PWA)

- **Instalação Nativa Chrome (`beforeinstallprompt`):** Banner e modal com detecção automática de suporte.
- **Service Worker (`public/sw.js`):** Cache offline de arquivos estáticos, imagens e navegação.
- **Manifest PWA (`public/manifest.json`):** Configurado em modo `standalone`, cor de tema Vermelho Industrial (`#D32F2F`) e ícones em alta resolução.
- **SplashScreen:** Logo animado e verificação de sessão/dispositivo.
- **Onboarding:** Carrossel industrial de 4 etapas com fotos reais e botão "PULAR".
- **Login:** Campo de crachá, teclado numérico industrial tátil com vibração (`navigator.vibrate`), temporizador de força bruta e RPC Supabase.
- **Aparelho Pendente:** Identificação do navegador/dispositivo, metadados e trava de segurança.
- **Ambiente de Homologação (Staging):** Exibição da sessão do operador e botão de logout seguro com limpeza local.
