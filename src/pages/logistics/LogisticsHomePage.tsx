import { Pressable, Text } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

import ScanIcon from '@/assets/icons/scan.svg';
import { EmptyPage } from '@/components/EmptyPage';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { LogisticsScreenProps } from '@/navigation/types';

type LogisticsHomePageProps = LogisticsScreenProps<'LogisticsHome'>;

export const LogisticsHomePage = ({ navigation }: LogisticsHomePageProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <EmptyPage description="收发" />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate(ROUTES.LOGISTICS.QR_SCAN);
        }}
        style={[styles.scanButton, { backgroundColor: colors.primary }]}
      >
        <ScanIcon color="#FFFFFF" width={20} height={20} />
        <Text style={styles.scanButtonText}>扫码</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    minWidth: 160,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
