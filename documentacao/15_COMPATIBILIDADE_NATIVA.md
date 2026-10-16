# 15 â€” COMPATIBILIDADE NATIVA E ANÃLISE DE PLATAFORMA (REACT NATIVE)

Este documento avalia a viabilidade e os requisitos de compatibilidade entre os recursos nativos utilizados pelo **AppEstoque Flutter** e o ecossistema **React Native / Expo**.

---

## 1. AvaliaÃ§Ã£o de Viabilidade TÃ©cnica por Recurso

| Recurso do Sistema | ImplementaÃ§Ã£o Original (Flutter) | ImplementaÃ§Ã£o Alvo (React Native) | Funciona no Expo Go? | Exige Expo Dev Build / Bare? | AvaliaÃ§Ã£o TÃ©cnica |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **IdentificaÃ§Ã£o do Aparelho (Device ID)** | `device_info_plus` (`androidInfo.id`, `identifierForVendor`) | `expo-application` (`getAndroidId()`) + `expo-device` | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Captura UUID imutÃ¡vel por instalaÃ§Ã£o/hardware. |
| **DetecÃ§Ã£o de Root / Jailbreak** | `MainActivity.kt` (varredura de 9 paths de `su` e `which su`) | `react-native-jail-monkey` ou Native Module customizado | **NÃƒO** | **SIM** | **CrÃ­tico:** Expo Go nÃ£o expÃµe inspeÃ§Ã£o de arquivos `/system/bin/su`. Requer Expo Dev Build. |
| **DetecÃ§Ã£o de Emulador** | `MainActivity.kt` (inspeÃ§Ã£o de `Build.FINGERPRINT` e `Build.MODEL`) | `expo-device` (`isDevice` property) | **SIM** | NÃ£o | **CompatÃ­vel 100%:** `Device.isDevice` retorna `false` em emuladores Android/iOS. |
| **Biometria (Fingerprint / FaceID)** | `local_auth` com `FlutterFragmentActivity` | `expo-local-authentication` | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Suporta BiometricPrompt (Android) e FaceID/TouchID (iOS). |
| **Assinatura EletrÃ´nica (PIN 4D)** | Modal customizado com hash SHA-256 | Modal React Native puro + `expo-crypto` | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Componente de interface padronizado com hash nativo. |
| **Timeout de Inatividade (30m)** | Timer periÃ³dico + `Listener(onPointerDown)` | `PanResponder` global ou TouchWrapper com Hook customizado | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Reseta timer a cada evento de interaÃ§Ã£o na tela. |
| **Scanner de CÃ³digo de Barras / QR** | `mobile_scanner` com cÃ¢mera traseira e lanterna | `expo-camera` (`CameraView` com `onBarcodeScanned`) | **SIM** | NÃ£o | **CompatÃ­vel 100%:** LÃª EAN-13, CODE-128, QR Code e suporta controle de lanterna (Torch). |
| **GeolocalizaÃ§Ã£o (GPS)** | `geolocator` com precisÃ£o mÃ©dia e timeout de 3s | `expo-location` (`getCurrentPositionAsync`) | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Suporta precisÃ£o balanceada com timeout estrito. |
| **Fila Offline & Cache** | `shared_preferences` + `flutter_secure_storage` | `@react-native-async-storage/async-storage` + `expo-secure-store` | **SIM** | NÃ£o (AsyncStorage) / Sim (MMKV) | **CompatÃ­vel:** AsyncStorage funciona no Expo Go; se optar por MMKV (10x mais rÃ¡pido), exige Dev Build. |
| **Monitor de Rede (Offline Detection)** | InterceptaÃ§Ã£o de `SocketException` no try/catch | `@react-native-community/netinfo` | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Listener em tempo real do estado de conexÃ£o. |
| **Som de Bipe Industrial (Scanner)** | MethodChannel Kotlin com `ToneGenerator(STREAM_MUSIC)` | `expo-av` (reproduzindo Ã¡udio WAV idÃªntico) OU Native Module | **SIM (via WAV)** | Sim (se via ToneGenerator) | **CompatÃ­vel:** Arquivo WAV com tom puro de 2500Hz por 150ms reproduz com latÃªncia imperceptÃ­vel. |
| **VibraÃ§Ã£o TÃ¡til (Haptic Feedback)** | `HapticFeedback.lightImpact()` | `expo-haptics` (`impactAsync(ImpactFeedbackStyle.Light)`) | **SIM** | NÃ£o | **CompatÃ­vel 100%:** Resposta fÃ­sica idÃªntica ao ler cÃ³digo. |

---

## 2. DecisÃ£o Arquitetural MandatÃ³ria: Expo Go vs Expo Development Build

> [!WARNING]
> **CONCLUSÃƒO TÃ‰CNICA DEFINITIVA:**
> O aplicativo **NÃƒO PODE SER LIMITADO AO EXPO GO**.
> A migraÃ§Ã£o deve adotar obrigatoriamente o **Expo Development Build (EAS Build / `npx expo run:android`)**.

### Justificativas TÃ©cnicas:
1. **DetecÃ§Ã£o AvanÃ§ada de Root e Anti-Tamper:** O pacote corporativo `react-native-jail-monkey` e inspeÃ§Ãµes nativas de binÃ¡rios `su` contÃªm cÃ³digo nativo em C++/Java que o runtime padrÃ£o do Expo Go nÃ£o suporta.
2. **LatÃªncia de Leitura e Performance de Cache:** O uso de **react-native-mmkv** (banco de chave-valor em C++ baseado em memÃ³ria mapeada do WeChat) garante que a fila offline de movimentaÃ§Ãµes seja gravada instantaneamente sem travar a interface, exigindo compilaÃ§Ã£o nativa.
3. **Controle Estrito de PermissÃµes no AndroidManifest:** ConfiguraÃ§Ãµes como hardware acceleration, window soft input mode e queries de pacotes no Android 11+ exigem o uso do sistema de Prebuild (`app.json` com Config Plugins).