import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Platform, StatusBar } from 'react-native';

/** 收发首页聚焦时同步状态栏（从扫码/搜索返回后需重新应用） */
export const useReceivingHomeStatusBar = (
  navigation: NavigationProp<ParamListBase>,
  hasSelectedData: boolean,
) => {
  useFocusEffect(
    useCallback(() => {
      const nativeStyle = hasSelectedData ? 'light' : 'dark';
      navigation.setOptions({ statusBarStyle: nativeStyle });
      StatusBar.setBarStyle(hasSelectedData ? 'light-content' : 'dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }
    }, [hasSelectedData, navigation]),
  );
};
