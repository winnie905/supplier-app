import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Card, Modal, VStack } from 'design-system-native';
import { useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';

import CareModeIcon from '@/assets/icons/care.svg';
import CloseIcon from '@/assets/icons/close.svg';
import InfoIcon from '@/assets/icons/icon_about.svg';
import { meBackgroundImage } from '@/components/images';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { APP_VERSION } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MeScreenProps } from '@/navigation/types';
import { MeLogoutSection } from '@/sections/me/MeLogoutSection';
import { MeProfileSection } from '@/sections/me/MeProfileSection';
import { MeSettingsSection } from '@/sections/me/MeSettingsSection';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCareModeStore } from '@/store/careModeStore';

type MePageProps = MeScreenProps<'MeHome'>;

export const MePage = ({ navigation }: MePageProps) => {
  const { colors, tokens } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();

  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const careModeEnabled = useCareModeStore((state) => state.enabled);
  const setCareModeEnabled = useCareModeStore((state) => state.setEnabled);
  const setLoading = useAppStore((state) => state.setLoading);

  const settingsItems = useMemo(
    () => [
      {
        icon: <InfoIcon color={colors.text} />,
        onPress: () => {
          navigation.navigate(ROUTES.ME.ABOUT);
        },
        rightLabel: APP_VERSION,
        title: '关于',
      },
      {
        icon: <CareModeIcon color={colors.text} />,
        rightLabel: <ToggleSwitch value={careModeEnabled} onValueChange={setCareModeEnabled} />,
        title: '关怀模式',
      },
      {
        icon: <CloseIcon color={colors.text} />,
        onPress: () => {
          setIsDeleteAccountOpen(true);
        },
        title: '注销账号',
      },
    ],
    [careModeEnabled, colors.text, navigation, setCareModeEnabled],
  );

  const handleCloseLogoutModal = () => {
    setIsLogoutOpen(false);
  };

  const handleConfirmLogout = async () => {
    setLoading(true);
    setIsLogoutOpen(false);

    try {
      await signOut();
    } catch (error) {
      console.error('signOut error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeleteAccount = () => {
    setIsDeleteAccountOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.page}>
      <ImageBackground resizeMode="cover" source={meBackgroundImage} style={styles.container}>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            padding: tokens.spacing.lg,
            paddingBottom: tokens.spacing.lg + tabBarHeight,
            rowGap: tokens.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <VStack style={{ gap: tokens.spacing.lg }}>
            <Card
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderColor: '#fff',
                gap: 0,
                padding: 0,
                borderRadius: tokens.radius.md,
                elevation: 0,
                shadowOpacity: 0,
                boxShadow: 'none',
              }}
            >
              <MeProfileSection user={user} />

              <Card
                style={{
                  borderWidth: 0,
                  boxShadow: 'none',
                  borderRadius: tokens.radius.md,
                  elevation: 0,
                  shadowOpacity: 0,
                  paddingVertical: 0,
                }}
              >
                <MeSettingsSection items={settingsItems} />
              </Card>
            </Card>

            <MeLogoutSection
              label="退出登录"
              onPress={() => {
                setIsLogoutOpen(true);
              }}
            />
          </VStack>
        </ScrollView>

        <Modal
          visible={isLogoutOpen}
          animationType="fade"
          onClose={handleCloseLogoutModal}
          title="退出登录"
          content="确定要退出当前账号吗？"
          cancelText="取消"
          okText="退出登录"
          onCancel={handleCloseLogoutModal}
          onOk={handleConfirmLogout}
        />

        <Modal
          visible={isDeleteAccountOpen}
          animationType="fade"
          onClose={handleCloseDeleteAccount}
          title="注销账号"
          content="我们正在处理您的删除请求，大概需要5个工作日。"
          okText="确定"
          onOk={handleCloseDeleteAccount}
        />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F6F9',
  },

  container: {
    flex: 1,
    paddingTop: 100,
  },
});
