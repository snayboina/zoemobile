import React from 'react';
import { HomeScreen } from '../home/HomeScreen';

interface DiagnosticScreenProps {
  onNavigate: (route: string) => void;
}

export const EnvironmentDiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ onNavigate }) => {
  return <HomeScreen onNavigate={onNavigate} />;
};
