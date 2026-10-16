# 07 â€” DEPENDÃŠNCIAS E SERVIÃ‡OS EXTERNOS

## 1. Mapeamento Comparativo: Flutter -> React Native

| Pacote Flutter (`pubspec.yaml`) | VersÃ£o Original | Pacote Equivalente React Native | Finalidade TÃ©cnica no Sistema |
| :--- | :---: | :--- | :--- |
| `supabase_flutter` | `^2.5.0` | `@supabase/supabase-js` | Cliente HTTP/WebSocket para PostgREST, RPCs e Storage. |
| `mobile_scanner` | `^5.0.0` | `expo-camera` ou `react-native-vision-camera` | Visor de cÃ¢mera e decodificaÃ§Ã£o de cÃ³digos de barras / QR Codes. |
| `intl` | `^0.19.0` | `date-fns` ou `Intl` nativo | FormataÃ§Ã£o de datas em padrÃ£o brasileiro (`dd/MM/yyyy HH:mm`) e moedas. |
| `provider` | `^6.1.2` | `zustand` | Gerenciamento de estado reativo, stores globais e injeÃ§Ã£o de serviÃ§os. |
| `shared_preferences` | `^2.2.3` | `@react-native-async-storage/async-storage` ou `react-native-mmkv` | Armazenamento de cache offline de catÃ¡logos e fila de sincronizaÃ§Ã£o. |
| `flutter_dotenv` | `^5.1.0` | `react-native-dotenv` ou `expo-constants` | Leitura de variÃ¡veis de ambiente (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). |
| `google_fonts` | `^6.1.0` | `@expo-google-fonts/poppins` / `@expo-google-fonts/inter` | Tipografia padronizada de alta legibilidade. |
| `dropdown_search` | `^7.0.0` | `react-native-element-dropdown` ou Modal Customizado | Seletores pesquisÃ¡veis com busca incremental para produtos e funcionÃ¡rios. |
| `flutter_secure_storage` | `^9.2.2` | `expo-secure-store` ou `react-native-keychain` | Armazenamento seguro de sessÃ£o, PINs locais e credenciais em Keystore/Keychain. |
| `local_auth` | `^2.2.0` | `expo-local-authentication` | AutenticaÃ§Ã£o biomÃ©trica por impressÃ£o digital ou reconhecimento facial. |
| `device_info_plus` | `^10.1.0` | `expo-device` e `expo-application` | Captura de UUID do aparelho, modelo, fabricante e versÃ£o do sistema operacional. |
| `connectivity_plus` | `^6.0.3` | `@react-native-community/netinfo` | Monitoramento do estado da conexÃ£o com a internet para ativaÃ§Ã£o da fila offline. |
| `geolocator` | `^11.0.0` | `expo-location` | Captura das coordenadas de latitude e longitude no momento de transaÃ§Ãµes. |
| `crypto` | `^3.0.3` | `expo-crypto` ou `crypto-js` | GeraÃ§Ã£o de hash SHA-256 para senhas e PINs. |
| `uuid` | `^4.5.3` | `uuid` | GeraÃ§Ã£o de identificadores Ãºnicos para sessÃµes e IDs offline de transaÃ§Ãµes. |

---

## 2. Hardware e Recursos Nativo do Sistema
1. **CÃ¢mera e Scanner:**
   - Exige permissÃ£o `android.permission.CAMERA` e `NSCameraUsageDescription`.
   - Controle de lanterna (Flash/Torch) integrado Ã  tela do leitor.
2. **Ãudio e Som de Bipe Industrial:**
   - No Flutter, executado via MethodChannel Kotlin com `ToneGenerator(AudioManager.STREAM_MUSIC, 100)`.
   - No React Native, serÃ¡ implementado via `expo-av` reproduzindo um arquivo WAV de 150ms com tom puro de 2500Hz, ou via Native Module Kotlin/Swift.
3. **VibraÃ§Ã£o TÃ¡til:**
   - Feedback de impacto leve ao ler cÃ³digos com sucesso (`HapticFeedback.lightImpact()` -> `expo-haptics`).
4. **LocalizaÃ§Ã£o em Segundo Plano e Uso:**
   - PermissÃµes `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` no Android e `NSLocationWhenInUseUsageDescription` no iOS com justificativa clara de auditoria fÃ­sica.