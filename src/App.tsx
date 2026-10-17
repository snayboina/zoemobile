import { useState, useEffect } from 'react';
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
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'splash';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentRoute(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'splash':
        return <SplashScreen onNavigate={navigateTo} />;
      case 'onboarding':
        return <OnboardingScreen onNavigate={navigateTo} />;
      case 'login':
        return <LoginScreen onNavigate={navigateTo} />;
      case 'pending_device':
        return <PendingDeviceScreen onNavigate={navigateTo} />;
      case 'home':
        return <HomeScreen onNavigate={navigateTo} />;
      case 'entrada':
        return <EntradaScreen onBack={() => navigateTo('home')} />;
      case 'saida':
        return <SaidaScreen onBack={() => navigateTo('home')} />;
      case 'devolucao':
        return <DevolucaoScreen onBack={() => navigateTo('home')} />;
      case 'nada_consta':
        return <NadaConstaScreen onBack={() => navigateTo('home')} />;
      case 'inventario':
        return <InventarioScreen onBack={() => navigateTo('home')} />;
      case 'movimentacoes':
        return <MovimentacoesScreen onBack={() => navigateTo('home')} />;
      case 'scanner':
        return <ScannerScreen onBack={() => navigateTo('home')} />;
      case 'localizacao':
        return <LocalizacaoScreen onBack={() => navigateTo('home')} />;
      case 'diagnostic':
        return <EnvironmentDiagnosticScreen onNavigate={navigateTo} />;
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      {/* Banner de Instalação no Celular (Chrome PWA) - Apenas fora da tela de splash */}
      {currentRoute !== 'splash' && <InstallBanner />}

      {/* Tela Ativa */}
      {renderCurrentScreen()}
    </div>
  );
}
