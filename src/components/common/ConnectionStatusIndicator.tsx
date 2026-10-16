import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { theme } from '../../theme';

export interface ConnectionStatusIndicatorProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isOnline,
  isSyncing = false,
  pendingCount = 0,
}) => {
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null; // Oculta quando tudo estiver 100% online e sincronizado
  }

  const getStatusContent = () => {
    if (isSyncing) {
      return {
        bg: theme.colors.infoBackground,
        color: theme.colors.info,
        icon: <RefreshCw size={14} color={theme.colors.info} />,
        text: 'Sincronizando com a nuvem...',
      };
    }
    if (!isOnline) {
      return {
        bg: theme.colors.warningBackground,
        color: theme.colors.warning,
        icon: <WifiOff size={14} color={theme.colors.warning} />,
        text: pendingCount > 0 ? `Offline (${pendingCount} pendente${pendingCount > 1 ? 's' : ''})` : 'Modo Operacional Offline',
      };
    }
    return {
      bg: theme.colors.successBackground,
      color: theme.colors.success,
      icon: <Wifi size={14} color={theme.colors.success} />,
      text: 'Conectado',
    };
  };

  const status = getStatusContent();

  return (
    <View style={[styles.pill, { backgroundColor: status.bg, borderColor: status.color }]} testID="connection-status-pill">
      {status.icon}
      <Text style={[styles.text, { color: status.color }]}>{status.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
