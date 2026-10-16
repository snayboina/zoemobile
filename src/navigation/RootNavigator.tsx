import React from 'react';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { PendingDeviceScreen } from '../screens/auth/PendingDeviceScreen';
import { EnvironmentDiagnosticScreen } from '../screens/diagnostic/EnvironmentDiagnosticScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const customDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    notification: theme.colors.danger,
  },
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={customDarkTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PendingDevice" component={PendingDeviceScreen} />
        <Stack.Screen name="DiagnosticHome" component={EnvironmentDiagnosticScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
