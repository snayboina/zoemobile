import { useState } from 'react';
import { InstallBanner } from './components/pwa/InstallBanner';
import { SplashScreen } from './screens/auth/SplashScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { PendingDeviceScreen } from './screens/auth/PendingDeviceScreen';
import { HomeScreen } from './screens/home/HomeScreen';
import { EntradaScreen } from './screens/operations/EntradaScreen';
import { SaidaScreen } from './screens/operations/SaidaScreen';
import { DevolucaoScreen } from './screens/operations/DevolucaoScreen';
import { NadaConstaScreen } from './screens/operations/NadaConstaScreen';
import { InventarioScreen } from './screens/operations/InventarioScreen';
import { MovimentacoesScreen } from './screens/operations/MovimentacoesScreen';
import { ScannerScreen } from './screens/operations/ScannerScreen';
import { LocalizacaoScreen } from './screens/operations/LocalizacaoScreen';
import { EnvironmentDiagnosticScreen } from './screens/diagnostic/EnvironmentDiagnosticScreen';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('splash');

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'splash':
        return <SplashScreen onNavigate={setCurrentRoute} />;
      case 'onboarding':
        return <OnboardingScreen onNavigate={setCurrentRoute} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentRoute} />;
      case 'pending_device':
        return <PendingDeviceScreen onNavigate={setCurrentRoute} />;
      case 'home':
        return <HomeScreen onNavigate={setCurrentRoute} />;
      case 'entrada':
        return <EntradaScreen onBack={() => setCurrentRoute('home')} />;
      case 'saida':
        return <SaidaScreen onBack={() => setCurrentRoute('home')} />;
      case 'devolucao':
        return <DevolucaoScreen onBack={() => setCurrentRoute('home')} />;
      case 'nada_consta':
        return <NadaConstaScreen onBack={() => setCurrentRoute('home')} />;
      case 'inventario':
        return <InventarioScreen onBack={() => setCurrentRoute('home')} />;
      case 'movimentacoes':
        return <MovimentacoesScreen onBack={() => setCurrentRoute('home')} />;
      case 'scanner':
        return <ScannerScreen onBack={() => setCurrentRoute('home')} />;
      case 'localizacao':
        return <LocalizacaoScreen onBack={() => setCurrentRoute('home')} />;
      case 'diagnostic':
        return <EnvironmentDiagnosticScreen onNavigate={setCurrentRoute} />;
      default:
        return <HomeScreen onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <div className="app-container">
      {/* Banner de Instalação no Celular (Chrome PWA) */}
      <InstallBanner />

      {/* Tela Ativa */}
      {renderCurrentScreen()}
    </div>
  );
}
