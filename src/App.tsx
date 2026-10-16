import { useState } from 'react';
import { InstallBanner } from './components/pwa/InstallBanner';
import { SplashScreen } from './screens/auth/SplashScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { PendingDeviceScreen } from './screens/auth/PendingDeviceScreen';
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
        return <EnvironmentDiagnosticScreen onNavigate={setCurrentRoute} />;
      default:
        return <LoginScreen onNavigate={setCurrentRoute} />;
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
