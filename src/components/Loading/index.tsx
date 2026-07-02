import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export const Loading = ({ isLoading }: { isLoading: boolean }) => {
  const { colors } = useAppTheme();
  if (!isLoading) {
    return null;
  }
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
