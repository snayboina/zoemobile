export type RootStackParamList = {
  EnvironmentDiagnostic: undefined;
  AuthStack: undefined;
  AppTabs: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  LoginCracha: undefined;
  CadastroSenhaInicial: { funcionarioId: string; nome: string };
};

export type AppTabsParamList = {
  HomeDashboard: undefined;
  ScannerEstoque: undefined;
  MovimentacaoMenu: undefined;
  HistoricoSincronizacao: undefined;
};
